/* Lock HBO HLS to top video and one preferred audio format; retain its languages. */
(function () {
  var prefix = '[HBO iPad Quality] ';
  try {
    if (!/^https:\/\/[^/?#]+\/(?:[^?#]*\/)?(?:hls|[^/?#]+_fallback)\.m3u8(?:\?|$)/.test($request.url)) {
      $done({});
      return;
    }
    var host = $request.url.split('/')[2];
    if (!/(?:^|\.)(?:e\.hbo|media\.max\.com|media\.h264\.io)$/.test(host)) {
      $done({});
      return;
    }
    var body = $response.body;
    if (typeof body !== 'string' || !/^#EXTM3U/.test(body) || body.indexOf('#EXT-X-STREAM-INF:') < 0) {
      $done({});
      return;
    }
    var newline = body.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
    var lines = body.split(/\r?\n/);
    function attrs(line) {
      var out = {}, regex = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/g, match;
      while ((match = regex.exec(line.slice(line.indexOf(':') + 1)))) {
        var value = match[2];
        out[match[1]] = value.charAt(0) === '"' ? value.slice(1, -1) : value;
      }
      return out;
    }
    var variants = [];
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('#EXT-X-STREAM-INF:') !== 0) continue;
      var a = attrs(lines[i]);
      var size = /^(\d+)x(\d+)$/.exec(a.RESOLUTION || '');
      if (!size || !lines[i + 1] || lines[i + 1].charAt(0) === '#') throw new Error('Incomplete video variant');
      var codec = (a.CODECS || '').split(',')[0];
      // Prefer Dolby Vision profile 5 among variants at the highest resolution.
      var family = /^dvh1\.05\./.test(codec) ? 'dv5' : /^hvc1|^hev1/.test(codec) ? (a['VIDEO-RANGE'] === 'PQ' ? 'hevc-hdr' : 'hevc-sdr') : /^avc1/.test(codec) ? 'avc' : 'other';
      variants.push({index: i, attrs: a, width: +size[1], height: +size[2], family: family,
        average: +(a['AVERAGE-BANDWIDTH'] || a.BANDWIDTH || 0), peak: +(a.BANDWIDTH || 0)});
      i++;
    }
    if (!variants.length) throw new Error('No video variants');
    var maxPixels = Math.max.apply(null, variants.map(function (v) { return v.width * v.height; }));
    var top = variants.filter(function (v) { return v.width * v.height === maxPixels; });
    var preferences = ['dv5', 'hevc-hdr', 'hevc-sdr', 'avc', 'other'];
    var family;
    for (var j = 0; j < preferences.length; j++) {
      if (top.some(function (v) { return v.family === preferences[j]; })) { family = preferences[j]; break; }
    }
    top = top.filter(function (v) { return v.family === family; });
    // Identify audio families from codec and HLS JOC metadata, not bitrate alone.
    var audioMedia = Object.create(null);
    lines.forEach(function (line) {
      if (line.indexOf('#EXT-X-MEDIA:') !== 0) return;
      var m = attrs(line);
      if (m.TYPE !== 'AUDIO' || !m['GROUP-ID']) return;
      var key = m['GROUP-ID'];
      if (!audioMedia[key]) audioMedia[key] = {joc: false};
      if (/JOC/i.test(m.CHANNELS || '')) audioMedia[key].joc = true;
    });
    function audioRank(v) {
      var group = v.attrs.AUDIO || '';
      var codecs = v.attrs.CODECS || '';
      if (group && !audioMedia[group]) throw new Error('Missing audio group');
      if ((audioMedia[group] && audioMedia[group].joc) || /atmos/i.test(group) || /(?:^|,)ec\+3(?:,|$)/.test(codecs)) return 4;
      if (/(?:^|,)ec-3(?:,|$)/.test(codecs)) return 3;
      if (/(?:^|,)ac-3(?:,|$)/.test(codecs)) return 2;
      if (/(?:^|,)mp4a(?:\.|,|$)/.test(codecs)) return 1;
      return 0;
    }
    var rank = Math.max.apply(null, top.map(audioRank));
    top = top.filter(function (v) { return audioRank(v) === rank; });
    // Select one audio group, then one highest-bitrate video variant for it.
    var best = Object.create(null);
    top.forEach(function (v) {
      var key = v.attrs.AUDIO || '';
      var prev = best[key];
      if (!prev || v.average > prev.average || (v.average === prev.average && v.peak > prev.peak)) best[key] = v;
    });
    var winners = Object.keys(best).map(function (key) { return best[key]; });
    winners.sort(function (a, b) { return b.average - a.average || b.peak - a.peak || a.index - b.index; });
    best = Object.create(null);
    best[winners[0].attrs.AUDIO || ''] = winners[0];
    var keep = Object.create(null), groups = Object.create(null), selected = [];
    Object.keys(best).forEach(function (key) {
      var v = best[key]; keep[v.index] = true; selected.push(v);
      ['AUDIO', 'SUBTITLES', 'VIDEO', 'CLOSED-CAPTIONS'].forEach(function (type) {
        if (v.attrs[type] && v.attrs[type] !== 'NONE') groups[type + ':' + v.attrs[type]] = true;
      });
    });
    var result = [];
    for (var n = 0; n < lines.length; n++) {
      var line = lines[n];
      if (line.indexOf('#EXT-X-STREAM-INF:') === 0) {
        if (keep[n]) { result.push(line); result.push(lines[n + 1]); }
        n++;
      } else if (line.indexOf('#EXT-X-I-FRAME-STREAM-INF:') === 0) {
        // I-frame playlists are optional; omit lower-quality seek-only variants.
      } else if (line.indexOf('#EXT-X-MEDIA:') === 0) {
        var media = attrs(line);
        if (groups[media.TYPE + ':' + media['GROUP-ID']]) result.push(line);
      } else {
        result.push(line);
      }
    }
    console.log(prefix + 'locked ' + selected[0].width + 'x' + selected[0].height + ' ' + family + '; audio ' + (selected[0].attrs.AUDIO || 'embedded') + '; variants ' + variants.length + ' -> ' + selected.length);
    $done({body: result.join(newline)});
  } catch (error) {
    console.log(prefix + 'Skipped: rewrite failed; original content retained');
    $done({});
  }
})();
