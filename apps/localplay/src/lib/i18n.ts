/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "localplay:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  zh: "zh",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "nowPlaying"
  | "nothingPlaying"
  | "nothingPlayingHint"
  | "play"
  | "pause"
  | "next"
  | "prev"
  | "shuffle"
  | "repeat"
  | "repeatOff"
  | "repeatAll"
  | "repeatOne"
  | "speed"
  | "eq"
  | "eqTitle"
  | "eqLow"
  | "eqMid"
  | "eqHigh"
  | "eqReset"
  | "eqHint"
  | "eqUnsupported"
  | "addFiles"
  | "addFolder"
  | "addHint"
  | "formats"
  | "libraryTitle"
  | "viewTracks"
  | "viewAlbums"
  | "viewArtists"
  | "viewPlaylists"
  | "viewFavorites"
  | "viewRecent"
  | "queueTitle"
  | "searchPlaceholder"
  | "emptyLibraryTitle"
  | "emptyLibraryHint"
  | "emptyView"
  | "noResults"
  | "unknownArtist"
  | "unknownAlbum"
  | "trackCount"
  | "favorite"
  | "unfavorite"
  | "addToPlaylist"
  | "addToQueue"
  | "playAll"
  | "shuffleAll"
  | "edit"
  | "remove"
  | "removeConfirm"
  | "removeFromPlaylist"
  | "removeFromQueue"
  | "clearQueue"
  | "clearQueueConfirm"
  | "queueEmpty"
  | "queuePosition"
  | "editTrack"
  | "fieldTitle"
  | "fieldArtist"
  | "fieldAlbum"
  | "fieldFile"
  | "save"
  | "cancel"
  | "close"
  | "back"
  | "newPlaylist"
  | "playlistName"
  | "playlistNamePlaceholder"
  | "create"
  | "renamePlaylist"
  | "deletePlaylist"
  | "deletePlaylistConfirm"
  | "emptyPlaylist"
  | "noPlaylists"
  | "addToPlaylistTitle"
  | "missingFile"
  | "missingHint"
  | "storageWarn"
  | "toastAdded"
  | "toastRelinked"
  | "toastSkipped"
  | "toastStoreFail"
  | "toastPlayFail"
  | "toastRemoved"
  | "toastSaved"
  | "toastExported"
  | "toastImported"
  | "toastImportBad"
  | "toastQueued"
  | "toastPlaylistCreated"
  | "toastPlaylistDeleted"
  | "toastAddedToPlaylist"
  | "exportJson"
  | "importJson"
  | "backupHint"
  | "chipOffline"
  | "chipNoSub"
  | "chipNoAds"
  | "chipJson"
  | "chipNoCaps"
  | "chipNoLogin"
  | "chipLocal"
  | "about"
  | "privacy"
  | "terms"
  | "guide";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "로컬플레이",
    shortName: "로컬플레이",
    tagline: "내 MP3를 골라 라이브러리로. 재생목록·셔플·반복. 로그인·구독·광고 없음.",
    metaDescription:
      "기기 안의 MP3·오디오 파일을 골라 넣는 로컬 음악 플레이어. 곡·앨범·아티스트 보기, 재생목록, 대기열, 즐겨찾기, 셔플·반복, 이퀄라이저와 재생 속도. 오프라인 재생, 계정 없음, 구독 없음, 재생 중 광고 없음, 곡 수 제한 없음, 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    nowPlaying: "지금 재생",
    nothingPlaying: "재생 중인 곡이 없습니다",
    nothingPlayingHint: "아래에서 파일이나 폴더를 넣고 곡을 누르세요.",
    play: "재생",
    pause: "일시정지",
    next: "다음 곡",
    prev: "이전 곡",
    shuffle: "셔플",
    repeat: "반복",
    repeatOff: "반복 없음",
    repeatAll: "전체 반복",
    repeatOne: "한 곡 반복",
    speed: "속도",
    eq: "EQ",
    eqTitle: "이퀄라이저",
    eqLow: "저음",
    eqMid: "중음",
    eqHigh: "고음",
    eqReset: "초기화",
    eqHint: "저음·중음·고음을 각각 −12~+12 dB로 조절합니다. 다음 재생부터 적용됩니다.",
    eqUnsupported: "이 브라우저는 이퀄라이저를 지원하지 않습니다. 재생과 속도는 그대로 됩니다.",
    addFiles: "파일 추가",
    addFolder: "폴더 추가",
    addHint: "고른 파일은 이 기기의 앱 저장소에 복사되어 다음에 열어도 그대로 재생됩니다.",
    formats: "MP3 · M4A · AAC · WAV · OGG · FLAC",
    libraryTitle: "라이브러리",
    viewTracks: "곡",
    viewAlbums: "앨범",
    viewArtists: "아티스트",
    viewPlaylists: "재생목록",
    viewFavorites: "즐겨찾기",
    viewRecent: "최근",
    queueTitle: "대기열",
    searchPlaceholder: "제목·아티스트·앨범 검색",
    emptyLibraryTitle: "아직 곡이 없습니다",
    emptyLibraryHint: "‘파일 추가’ 또는 ‘폴더 추가’로 MP3를 넣으세요. 곡 수 제한은 없습니다.",
    emptyView: "여기에 보일 곡이 없습니다.",
    noResults: "검색 결과가 없습니다.",
    unknownArtist: "아티스트 미상",
    unknownAlbum: "앨범 미상",
    trackCount: "{n}곡",
    favorite: "즐겨찾기에 추가",
    unfavorite: "즐겨찾기에서 빼기",
    addToPlaylist: "재생목록에 추가",
    addToQueue: "대기열에 추가",
    playAll: "전체 재생",
    shuffleAll: "셔플 재생",
    edit: "편집",
    remove: "라이브러리에서 삭제",
    removeConfirm: "이 곡을 라이브러리에서 뺄까요? 이 기기에 복사된 오디오도 지워집니다.",
    removeFromPlaylist: "재생목록에서 빼기",
    removeFromQueue: "대기열에서 빼기",
    clearQueue: "대기열 비우기",
    clearQueueConfirm: "대기열을 비울까요? 곡은 라이브러리에 남습니다.",
    queueEmpty: "대기열이 비어 있습니다.",
    queuePosition: "{i} / {n}",
    editTrack: "곡 정보 편집",
    fieldTitle: "제목",
    fieldArtist: "아티스트",
    fieldAlbum: "앨범",
    fieldFile: "파일",
    save: "저장",
    cancel: "취소",
    close: "닫기",
    back: "뒤로",
    newPlaylist: "새 재생목록",
    playlistName: "재생목록 이름",
    playlistNamePlaceholder: "예: 출근길",
    create: "만들기",
    renamePlaylist: "이름 바꾸기",
    deletePlaylist: "재생목록 삭제",
    deletePlaylistConfirm: "이 재생목록을 지울까요? 곡은 라이브러리에 남습니다.",
    emptyPlaylist: "비어 있는 재생목록입니다. 곡의 ‘…’에서 추가하세요.",
    noPlaylists: "재생목록이 없습니다. 위에서 하나 만드세요.",
    addToPlaylistTitle: "어느 재생목록에 넣을까요?",
    missingFile: "이 기기에 오디오가 없습니다",
    missingHint: "같은 파일을 다시 추가하면 파일 이름으로 자동 연결됩니다.",
    storageWarn: "이 브라우저는 앱 저장소를 지원하지 않아, 고른 파일은 이번 세션에서만 재생됩니다.",
    toastAdded: "{n}곡을 추가했습니다",
    toastRelinked: "{n}곡을 다시 연결했습니다",
    toastSkipped: "오디오가 아닌 파일 {n}개는 건너뛰었습니다",
    toastStoreFail: "일부 파일을 저장하지 못했습니다",
    toastPlayFail: "재생하지 못했습니다. 다시 눌러 주세요.",
    toastRemoved: "라이브러리에서 뺐습니다",
    toastSaved: "저장했습니다",
    toastExported: "내보냈습니다",
    toastImported: "가져왔습니다: {n}곡, 재생목록 {p}개",
    toastImportBad: "로컬플레이 백업 파일이 아닙니다.",
    toastQueued: "대기열에 추가했습니다",
    toastPlaylistCreated: "재생목록을 만들었습니다",
    toastPlaylistDeleted: "재생목록을 지웠습니다",
    toastAddedToPlaylist: "재생목록에 추가했습니다",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    backupHint:
      "백업에는 곡 정보·재생목록·즐겨찾기·최근 목록만 들어가고 오디오는 들어가지 않습니다. 새 기기에서는 JSON을 가져온 뒤 같은 폴더를 추가하면 파일 이름으로 다시 연결됩니다.",
    chipOffline: "오프라인 재생",
    chipNoSub: "구독 없음",
    chipNoAds: "재생 중 광고 없음",
    chipJson: "JSON 내보내기",
    chipNoCaps: "곡·재생목록 제한 없음",
    chipNoLogin: "로그인 없음",
    chipLocal: "데이터 이 기기만",
    about:
      "로컬플레이는 기기 안의 MP3를 그대로 재생하는 플레이어입니다. 파일을 넣으면 이 기기의 앱 저장소에 복사되고, 태그에서 제목·아티스트·앨범을 읽습니다. 스트리밍도, 계정도, 광고도 없습니다.",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Localplay",
    shortName: "Localplay",
    tagline: "Pick local MP3s into a library. Playlists, shuffle, repeat. No login, no subscription, no ads.",
    metaDescription:
      "An on-device music player for the MP3 and audio files you already own. Tracks, albums and artists views, playlists, a queue, favorites, shuffle and repeat, an equalizer and playback speed. Plays offline, no account, no subscription, no ads during playback, no track cap, data on this device only.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    nowPlaying: "Now playing",
    nothingPlaying: "Nothing playing",
    nothingPlayingHint: "Add files or a folder below, then tap a track.",
    play: "Play",
    pause: "Pause",
    next: "Next track",
    prev: "Previous track",
    shuffle: "Shuffle",
    repeat: "Repeat",
    repeatOff: "Repeat off",
    repeatAll: "Repeat all",
    repeatOne: "Repeat one",
    speed: "Speed",
    eq: "EQ",
    eqTitle: "Equalizer",
    eqLow: "Bass",
    eqMid: "Mid",
    eqHigh: "Treble",
    eqReset: "Reset",
    eqHint: "Bass, mid and treble from −12 to +12 dB. Takes effect from the next play.",
    eqUnsupported: "This browser has no equalizer support. Playback and speed still work.",
    addFiles: "Add files",
    addFolder: "Add folder",
    addHint: "Picked files are copied into this device's app storage, so they still play the next time you open the app.",
    formats: "MP3 · M4A · AAC · WAV · OGG · FLAC",
    libraryTitle: "Library",
    viewTracks: "Tracks",
    viewAlbums: "Albums",
    viewArtists: "Artists",
    viewPlaylists: "Playlists",
    viewFavorites: "Favorites",
    viewRecent: "Recent",
    queueTitle: "Queue",
    searchPlaceholder: "Search title, artist, album",
    emptyLibraryTitle: "No tracks yet",
    emptyLibraryHint: "Use “Add files” or “Add folder” to bring in your MP3s. There is no track limit.",
    emptyView: "Nothing to show here yet.",
    noResults: "No matches.",
    unknownArtist: "Unknown artist",
    unknownAlbum: "Unknown album",
    trackCount: "{n} tracks",
    favorite: "Add to favorites",
    unfavorite: "Remove from favorites",
    addToPlaylist: "Add to playlist",
    addToQueue: "Add to queue",
    playAll: "Play all",
    shuffleAll: "Shuffle all",
    edit: "Edit",
    remove: "Remove from library",
    removeConfirm: "Remove this track from the library? The copy stored on this device is deleted too.",
    removeFromPlaylist: "Remove from playlist",
    removeFromQueue: "Remove from queue",
    clearQueue: "Clear queue",
    clearQueueConfirm: "Clear the queue? Tracks stay in the library.",
    queueEmpty: "The queue is empty.",
    queuePosition: "{i} / {n}",
    editTrack: "Edit track info",
    fieldTitle: "Title",
    fieldArtist: "Artist",
    fieldAlbum: "Album",
    fieldFile: "File",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    back: "Back",
    newPlaylist: "New playlist",
    playlistName: "Playlist name",
    playlistNamePlaceholder: "e.g. Commute",
    create: "Create",
    renamePlaylist: "Rename",
    deletePlaylist: "Delete playlist",
    deletePlaylistConfirm: "Delete this playlist? Tracks stay in the library.",
    emptyPlaylist: "This playlist is empty. Use “…” on a track to add it.",
    noPlaylists: "No playlists yet. Create one above.",
    addToPlaylistTitle: "Which playlist?",
    missingFile: "Audio is not on this device",
    missingHint: "Add the same file again and it relinks by file name.",
    storageWarn: "This browser has no app storage, so picked files play for this session only.",
    toastAdded: "Added {n} tracks",
    toastRelinked: "Relinked {n} tracks",
    toastSkipped: "Skipped {n} non-audio files",
    toastStoreFail: "Some files could not be stored",
    toastPlayFail: "Could not play. Tap again.",
    toastRemoved: "Removed from library",
    toastSaved: "Saved",
    toastExported: "Exported",
    toastImported: "Imported {n} tracks, {p} playlists",
    toastImportBad: "That file is not a Localplay backup.",
    toastQueued: "Added to queue",
    toastPlaylistCreated: "Playlist created",
    toastPlaylistDeleted: "Playlist deleted",
    toastAddedToPlaylist: "Added to playlist",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    backupHint:
      "The backup holds track info, playlists, favorites and recents, never audio. On a new device, import the JSON and then add the same folder: tracks relink by file name.",
    chipOffline: "Offline play",
    chipNoSub: "No subscription",
    chipNoAds: "No ads during play",
    chipJson: "JSON export",
    chipNoCaps: "No track/playlist caps",
    chipNoLogin: "No login",
    chipLocal: "Data this device only",
    about:
      "Localplay plays the MP3s already on your device. Adding a file copies it into this device's app storage and reads title, artist and album from its tags. No streaming, no account, no ads.",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "ローカルプレイ",
    shortName: "ローカルプレイ",
    tagline: "端末のMP3を選んでライブラリに。プレイリスト・シャッフル・リピート。ログインも課金も広告もなし。",
    metaDescription:
      "端末内のMP3・音声ファイルを選んで入れるローカル音楽プレイヤー。曲・アルバム・アーティスト表示、プレイリスト、キュー、お気に入り、シャッフル・リピート、イコライザーと再生速度。オフライン再生、アカウントなし、サブスクなし、再生中の広告なし、曲数制限なし、データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    nowPlaying: "再生中",
    nothingPlaying: "再生中の曲はありません",
    nothingPlayingHint: "下でファイルかフォルダを追加して、曲をタップしてください。",
    play: "再生",
    pause: "一時停止",
    next: "次の曲",
    prev: "前の曲",
    shuffle: "シャッフル",
    repeat: "リピート",
    repeatOff: "リピートなし",
    repeatAll: "全曲リピート",
    repeatOne: "1曲リピート",
    speed: "速度",
    eq: "EQ",
    eqTitle: "イコライザー",
    eqLow: "低音",
    eqMid: "中音",
    eqHigh: "高音",
    eqReset: "リセット",
    eqHint: "低音・中音・高音をそれぞれ −12〜+12 dB で調整します。次の再生から反映されます。",
    eqUnsupported: "このブラウザはイコライザーに対応していません。再生と速度はそのまま使えます。",
    addFiles: "ファイルを追加",
    addFolder: "フォルダを追加",
    addHint: "選んだファイルはこの端末のアプリ領域にコピーされ、次に開いてもそのまま再生できます。",
    formats: "MP3 · M4A · AAC · WAV · OGG · FLAC",
    libraryTitle: "ライブラリ",
    viewTracks: "曲",
    viewAlbums: "アルバム",
    viewArtists: "アーティスト",
    viewPlaylists: "プレイリスト",
    viewFavorites: "お気に入り",
    viewRecent: "最近",
    queueTitle: "キュー",
    searchPlaceholder: "曲名・アーティスト・アルバムを検索",
    emptyLibraryTitle: "まだ曲がありません",
    emptyLibraryHint: "「ファイルを追加」か「フォルダを追加」でMP3を入れてください。曲数に制限はありません。",
    emptyView: "ここに表示する曲はありません。",
    noResults: "該当なし。",
    unknownArtist: "アーティスト不明",
    unknownAlbum: "アルバム不明",
    trackCount: "{n}曲",
    favorite: "お気に入りに追加",
    unfavorite: "お気に入りから外す",
    addToPlaylist: "プレイリストに追加",
    addToQueue: "キューに追加",
    playAll: "すべて再生",
    shuffleAll: "シャッフル再生",
    edit: "編集",
    remove: "ライブラリから削除",
    removeConfirm: "この曲をライブラリから外しますか？この端末にコピーした音声も消えます。",
    removeFromPlaylist: "プレイリストから外す",
    removeFromQueue: "キューから外す",
    clearQueue: "キューを空にする",
    clearQueueConfirm: "キューを空にしますか？曲はライブラリに残ります。",
    queueEmpty: "キューは空です。",
    queuePosition: "{i} / {n}",
    editTrack: "曲情報を編集",
    fieldTitle: "タイトル",
    fieldArtist: "アーティスト",
    fieldAlbum: "アルバム",
    fieldFile: "ファイル",
    save: "保存",
    cancel: "キャンセル",
    close: "閉じる",
    back: "戻る",
    newPlaylist: "新しいプレイリスト",
    playlistName: "プレイリスト名",
    playlistNamePlaceholder: "例: 通勤",
    create: "作成",
    renamePlaylist: "名前を変える",
    deletePlaylist: "プレイリストを削除",
    deletePlaylistConfirm: "このプレイリストを削除しますか？曲はライブラリに残ります。",
    emptyPlaylist: "空のプレイリストです。曲の「…」から追加してください。",
    noPlaylists: "プレイリストがありません。上で作成してください。",
    addToPlaylistTitle: "どのプレイリストに入れますか？",
    missingFile: "この端末に音声がありません",
    missingHint: "同じファイルをもう一度追加すると、ファイル名で自動的に結び直されます。",
    storageWarn: "このブラウザはアプリ領域に対応していないため、選んだファイルはこのセッション中だけ再生できます。",
    toastAdded: "{n}曲を追加しました",
    toastRelinked: "{n}曲を結び直しました",
    toastSkipped: "音声でないファイル{n}件をスキップしました",
    toastStoreFail: "一部のファイルを保存できませんでした",
    toastPlayFail: "再生できませんでした。もう一度タップしてください。",
    toastRemoved: "ライブラリから外しました",
    toastSaved: "保存しました",
    toastExported: "書き出しました",
    toastImported: "読み込みました: {n}曲、プレイリスト{p}件",
    toastImportBad: "ローカルプレイのバックアップファイルではありません。",
    toastQueued: "キューに追加しました",
    toastPlaylistCreated: "プレイリストを作成しました",
    toastPlaylistDeleted: "プレイリストを削除しました",
    toastAddedToPlaylist: "プレイリストに追加しました",
    exportJson: "JSONを書き出す",
    importJson: "JSONを読み込む",
    backupHint:
      "バックアップには曲情報・プレイリスト・お気に入り・最近だけが入り、音声は入りません。新しい端末ではJSONを読み込んでから同じフォルダを追加すると、ファイル名で結び直されます。",
    chipOffline: "オフライン再生",
    chipNoSub: "サブスクなし",
    chipNoAds: "再生中の広告なし",
    chipJson: "JSON書き出し",
    chipNoCaps: "曲・プレイリスト無制限",
    chipNoLogin: "ログインなし",
    chipLocal: "データはこの端末だけ",
    about:
      "ローカルプレイは端末にあるMP3をそのまま再生するプレイヤーです。ファイルを追加するとこの端末のアプリ領域にコピーされ、タグからタイトル・アーティスト・アルバムを読み取ります。ストリーミングもアカウントも広告もありません。",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "本地播放",
    shortName: "本地播放",
    tagline: "把手机里的 MP3 选进曲库。播放列表、随机、循环。无需登录，无订阅，无广告。",
    metaDescription:
      "把设备里的 MP3 和音频文件选进来的本地音乐播放器。曲目、专辑、歌手视图，播放列表，队列，收藏，随机和循环，均衡器和播放速度。离线播放，无账号，无订阅，播放时无广告，曲目不限，数据仅在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    nowPlaying: "正在播放",
    nothingPlaying: "没有正在播放的曲目",
    nothingPlayingHint: "在下面添加文件或文件夹，然后点一首歌。",
    play: "播放",
    pause: "暂停",
    next: "下一首",
    prev: "上一首",
    shuffle: "随机",
    repeat: "循环",
    repeatOff: "不循环",
    repeatAll: "全部循环",
    repeatOne: "单曲循环",
    speed: "速度",
    eq: "EQ",
    eqTitle: "均衡器",
    eqLow: "低音",
    eqMid: "中音",
    eqHigh: "高音",
    eqReset: "重置",
    eqHint: "低音、中音、高音各可在 −12 到 +12 dB 之间调节。从下一次播放起生效。",
    eqUnsupported: "此浏览器不支持均衡器。播放和速度仍可正常使用。",
    addFiles: "添加文件",
    addFolder: "添加文件夹",
    addHint: "选中的文件会复制到此设备的应用存储里，下次打开仍能直接播放。",
    formats: "MP3 · M4A · AAC · WAV · OGG · FLAC",
    libraryTitle: "曲库",
    viewTracks: "曲目",
    viewAlbums: "专辑",
    viewArtists: "歌手",
    viewPlaylists: "播放列表",
    viewFavorites: "收藏",
    viewRecent: "最近",
    queueTitle: "队列",
    searchPlaceholder: "搜索标题、歌手、专辑",
    emptyLibraryTitle: "还没有曲目",
    emptyLibraryHint: "用“添加文件”或“添加文件夹”把 MP3 放进来，数量不限。",
    emptyView: "这里还没有可显示的曲目。",
    noResults: "没有匹配结果。",
    unknownArtist: "未知歌手",
    unknownAlbum: "未知专辑",
    trackCount: "{n} 首",
    favorite: "加入收藏",
    unfavorite: "取消收藏",
    addToPlaylist: "加入播放列表",
    addToQueue: "加入队列",
    playAll: "全部播放",
    shuffleAll: "随机播放",
    edit: "编辑",
    remove: "从曲库删除",
    removeConfirm: "把这首歌从曲库删除？复制到此设备的音频也会一并删除。",
    removeFromPlaylist: "从播放列表移除",
    removeFromQueue: "从队列移除",
    clearQueue: "清空队列",
    clearQueueConfirm: "清空队列？曲目仍保留在曲库中。",
    queueEmpty: "队列是空的。",
    queuePosition: "{i} / {n}",
    editTrack: "编辑曲目信息",
    fieldTitle: "标题",
    fieldArtist: "歌手",
    fieldAlbum: "专辑",
    fieldFile: "文件",
    save: "保存",
    cancel: "取消",
    close: "关闭",
    back: "返回",
    newPlaylist: "新建播放列表",
    playlistName: "播放列表名称",
    playlistNamePlaceholder: "例如：通勤",
    create: "创建",
    renamePlaylist: "重命名",
    deletePlaylist: "删除播放列表",
    deletePlaylistConfirm: "删除这个播放列表？曲目仍保留在曲库中。",
    emptyPlaylist: "这个播放列表是空的。在曲目的“…”里添加。",
    noPlaylists: "还没有播放列表，在上面新建一个。",
    addToPlaylistTitle: "放进哪个播放列表？",
    missingFile: "此设备上没有这段音频",
    missingHint: "再次添加同一个文件，会按文件名自动重新关联。",
    storageWarn: "此浏览器不支持应用存储，所选文件只能在本次会话中播放。",
    toastAdded: "已添加 {n} 首",
    toastRelinked: "已重新关联 {n} 首",
    toastSkipped: "跳过了 {n} 个非音频文件",
    toastStoreFail: "部分文件未能保存",
    toastPlayFail: "无法播放，请再点一次。",
    toastRemoved: "已从曲库删除",
    toastSaved: "已保存",
    toastExported: "已导出",
    toastImported: "已导入 {n} 首、{p} 个播放列表",
    toastImportBad: "这不是本地播放的备份文件。",
    toastQueued: "已加入队列",
    toastPlaylistCreated: "已创建播放列表",
    toastPlaylistDeleted: "已删除播放列表",
    toastAddedToPlaylist: "已加入播放列表",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    backupHint:
      "备份只包含曲目信息、播放列表、收藏和最近记录，不包含音频。换新设备时先导入 JSON，再添加同一个文件夹，曲目会按文件名重新关联。",
    chipOffline: "离线播放",
    chipNoSub: "无订阅",
    chipNoAds: "播放时无广告",
    chipJson: "JSON 导出",
    chipNoCaps: "曲目/列表不限",
    chipNoLogin: "无需登录",
    chipLocal: "数据仅在此设备",
    about:
      "本地播放直接播放你设备里已有的 MP3。添加文件时会复制到此设备的应用存储，并从标签读取标题、歌手和专辑。不联网播放，没有账号，没有广告。",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
  },
};

/** Same mapping as the Worker. zh has its own card — never the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://localplay.try-dabble.com/og-image-ko.png",
  en: "https://localplay.try-dabble.com/og-image-en.png",
  ja: "https://localplay.try-dabble.com/og-image-ja.png",
  zh: "https://localplay.try-dabble.com/og-image-zh.png",
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as string[]).includes(value);
}

export function translate(
  lang: Lang,
  key: MsgKey,
  vars?: Record<string, string | number>,
): string {
  let out = I18N[lang]?.[key] ?? I18N.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

function readCookieLang(): Lang | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)td_lang=(ko|en|ja|zh)(?:;|$)/);
  return m && isLang(m[1]) ? m[1] : null;
}

function readStoredLang(): Lang | null {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return isLang(saved) ? saved : null;
  } catch {
    return null;
  }
}

function readNavigatorLang(): Lang {
  const nav = (navigator.language || "ko").toLowerCase();
  if (nav.startsWith("ko")) return "ko";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("en")) return "en";
  return "ko";
}

/**
 * ?lang= wins, then the td_lang cookie (so hops between try-dabble subdomains
 * keep the chosen language), then the language saved by this app, then the
 * browser. The Worker only sees the query and the cookie, so those two must
 * outrank local storage or the first HTML and the mounted app would disagree.
 */
export function detectLang(searchLang?: string | null): Lang {
  if (isLang(searchLang)) {
    rememberLang(searchLang);
    return searchLang;
  }
  const cookie = readCookieLang();
  if (cookie) {
    rememberLang(cookie);
    return cookie;
  }
  return readStoredLang() ?? readNavigatorLang();
}

/** Saves locally AND writes the shared cookie, so the next try-dabble app
 *  opens in the same language without a ?lang= on the link. */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode — the language just will not stick */
  }
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `td_lang=${lang}; Domain=.try-dabble.com; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  } catch {
    /* file:// or a blocked cookie jar — local storage still carries it */
  }
}

export type Translate = (
  key: MsgKey,
  vars?: Record<string, string | number>,
) => string;
