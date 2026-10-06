# HBO Apple TV + 最高画质与音频

只需启用这一个 Loon 插件。包内两个脚本由它自动调用：播放申请先改写为 Apple TV 身份，随后取得主清单时筛选视频和音频。

## 安装

1. 解压，把包内两个 .js 文件放到 iCloud Drive → Loon → Script，保留原文件名；已有同名文件时用本包文件替换。
2. 关闭原来的 HBO Apple TV 身份实验、HBO 最高画质锁定、HBO 最高画质与音频锁定和 HBO StartupTest 插件（如果已安装），避免重复改写。
3. 导入并启用 HBO-AppleTV-MaxAV.plugin。开启 Loon 脚本与 MITM，并确认 MITM 证书已安装、信任。
4. 彻底退出 HBO App，再重新打开播放。

## 选择规则

- 仅改写 iPad 发出的指定 playbackInfo 请求，声明 Apple TV 设备型号和 tvOS 平台。
- 视频选择清单中最大像素数的档位；同分辨率优先 Dolby Vision Profile 5、HEVC HDR、HEVC SDR、AVC，再选择平均码率最高的记录。片源最高为 1080p 时就选 1080p。
- 在选定视频格式下，音频组优先 Atmos → EAC3 → AC3 → AAC；保留所选组内的语言和口述影像，以及视频引用的字幕组。
- 保留原始播放地址、会话密钥和 DRM 数据。不修改字幕默认语言或播放器代码。

仅能选择服务器实际给出的档位，不能生成片源没有的 4K。强制最高档可能增加启动和拖动等待。音频按格式优先，不能保证所有设备都能播放；有 Atmos 但设备不支持时不会自动退回 AAC。

日志仍分别显示 [HBO AppleTV experiment] 和 [HBO MaxAV]，它们属于同一个插件的两个阶段。关闭这个插件即可停用两项改写；随后彻底退出 HBO 再打开。

## 在线安装

在 Loon 插件页面添加以下地址，无需手动复制脚本：

```
https://raw.githubusercontent.com/sanyue025-create/hbo-appletv-maxav-loon/main/HBO-AppleTV-MaxAV.plugin
```

开启脚本与 MITM，并安装、信任 MITM 证书。关闭其他修改同一播放接口或主清单的插件，彻底退出 HBO App 后重新打开。

## 隐私

仓库不包含抓包、账号令牌、订阅信息、个人服务器配置或密钥。脚本没有新增网络请求、统计或上传功能；只在 Loon 内处理原本发往 HBO 的请求和清单。正常日志包含设备型号和所选视频、音频格式，不输出请求体、播放地址或 DRM 数据；异常时仅输出通用提示。

Apple TV 身份改写是实验性行为，不保证所有地区、客户端和片源有效。仍需有效订阅及设备本身的播放能力；本插件不绕过 DRM，也不会解锁订阅权限。

## 许可证

MIT，详见 [LICENSE](LICENSE)。本项目与 HBO、Apple、Loon 无隶属关系。
