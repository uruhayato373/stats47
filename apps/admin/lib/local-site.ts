/** 管理画面は公開前の変更を確かめる道具なので、サイトのページはローカルの開発サーバーで開く (`npm run dev:web`)。 */
const LOCAL_SITE_ORIGIN = "http://localhost:3000";

export const localSiteHref = (path: string) => `${LOCAL_SITE_ORIGIN}${path}`;
