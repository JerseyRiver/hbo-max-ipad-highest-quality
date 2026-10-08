/* Prefer a validated, server-provided main-only playback fallback. */
(function () {
  var prefix = '[HBO iPad MainOnly] ';
  try {
    if (!/^https:\/\/default\.any-any\.prd\.api\.discomax\.com\/playback-orchestrator\/any\/playback-orchestrator\/v1\/playbackInfo(?:\?|$)/.test($request.url)) {
      $done({}); return;
    }
    if (typeof $response.body !== 'string') { $done({}); return; }
    var status = $response.statusCode !== undefined ? $response.statusCode : $response.status;
    if (status !== undefined && !/^(?:HTTP\/\S+\s+)?200(?:\s|$)/.test(String(status))) {
      $done({}); return;
    }
    var original = JSON.parse($response.body);
    var fallback = original.fallback;
    if (!fallback || !fallback.manifest || fallback.manifest.type !== 'single-video' || fallback.manifest.format !== 'hls' ||
        !Array.isArray(fallback.videos) || fallback.videos.length !== 1 || fallback.videos[0].type !== 'main') {
      $done({}); return;
    }
    var manifestUrl = fallback.manifest.url;
    if (typeof manifestUrl !== 'string' || !/^https:\/\/[^/?#@]+\/[^?#]+\.m3u8(?:\?|$)/.test(manifestUrl)) {
      $done({}); return;
    }
    var host = manifestUrl.split('/')[2];
    if (!/(?:^|\.)(?:e\.hbo|media\.max\.com|media\.h264\.io)$/.test(host)) {
      $done({}); return;
    }
    var main = fallback.videos[0];
    if (typeof main.start !== 'number' || main.start !== 0 || typeof main.duration !== 'number' || !isFinite(main.duration) || main.duration <= 0) {
      $done({}); return;
    }
    var originalMains = Array.isArray(original.videos) ? original.videos.filter(function (video) { return video.type === 'main'; }) : [];
    if (originalMains.length !== 1 || typeof originalMains[0].duration !== 'number' ||
        Math.abs(originalMains[0].duration - main.duration) > 0.1 ||
        !main.manifestationId || main.manifestationId !== originalMains[0].manifestationId) {
      $done({}); return;
    }
    if (!fallback.cdn || !fallback.drm || !fallback.ssaiInfo || !Array.isArray(fallback.capabilities)) {
      $done({}); return;
    }
    // Use the complete server fallback, including its zero-based chapter timeline,
    // DRM, CDN, capabilities and SSAI metadata. Do not retain the old playlist ID.
    console.log(prefix + 'Using server main-only fallback');
    $done({body: JSON.stringify(fallback)});
  } catch (error) {
    console.log(prefix + 'Skipped: rewrite failed; original content retained');
    $done({});
  }
})();
