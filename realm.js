// ==MiruExtension==
// @name         RealmNovel
// @version      v1.0.0
// @author       Custom
// @lang         en
// @license      MIT
// @icon         https://www.realmnovel.com/favicon.ico
// @package      realm.novel
// @type         novel
// @webSite      https://www.realmnovel.com
// @nsfw         false
// ==/MiruExtension==

// ✅ التأكد من أن الكود يعرف `Extension` قبل الاستخدام
import BaseExtension from "miru-framework";

export default class RealmNovel extends BaseExtension {
  async latest() {
    const res = await this.request("/");
    const novelsList = res.match(/<div class="novel-item">[\s\S]+?<\/div>/g);
    const novels = [];
    
    if (!novelsList) return novels;

    novelsList.forEach((element) => {
      const url = element.match(/href="(.+?)"/)?.[1] || "";
      const title = element.match(/title="(.+?)"/)?.[1]?.trim() || "Unknown";
      const cover = element.match(/src="(.+?)"/)?.[1] || "";

      novels.push({
        title,
        url,
        cover,
      });
    });

    return novels;
  }

  async search(kw) {
    const searchUrl = `/search/${kw.replace(/\s+/g, '_')}`;
    const res = await this.request(searchUrl);
    const searchList = res.match(/<div class="novel-item">[\s\S]+?<\/div>/g);
    const novels = [];

    if (!searchList) return novels;

    searchList.forEach((element) => {
      const url = element.match(/href="(.+?)"/)?.[1] || "";
      const title = element.match(/title="(.+?)"/)?.[1]?.trim() || "Unknown";
      const cover = element.match(/src="(.+?)"/)?.[1] || "";

      novels.push({
        title,
        url,
        cover,
      });
    });

    return novels;
  }

  async detail(url) {
    const res = await this.request(url, {
      headers: {
        "miru-referer": "https://www.realmnovel.com/",
      },
    });

    const title = res.match(/<h1.*?>(.*?)<\/h1>/)?.[1] || "Unknown";
    const cover = res.match(/<img class="cover" src="(.+?)"/)?.[1] || "";
    const desc = res.match(/<div class="novel-summary">([\s\S]+?)<\/div>/)?.[1]
      ?.replace(/<[^>]+>/g, '')
      ?.trim() || "No description available";

    const episodes = [];
    const episodeList = res.match(/<li class="chapter-item">([\s\S]+?)<\/li>/g) || [];

    episodeList.forEach((element) => {
      const name = element.match(/>(.+?)<\/a>/)?.[1]?.trim() || "Unknown";
      const url = element.match(/href="(.+?)"/)?.[1] || "";

      episodes.push({
        name,
        url,
      });
    });

    return {
      title,
      cover,
      desc,
      episodes: [
        {
          title: "Chapters",
          urls: episodes.reverse(),
        },
      ],
    };
  }

  async watch(url) {
    const res = await this.request(url);
    const title = res.match(/<h1 class="chapter-title">([\s\S]+?)<\/h1>/)?.[1]?.trim() || "Unknown";
    
    let contentDiv = res.match(/<div class="chapter-content">([\s\S]+?)<\/div>/)?.[1] || "";
    contentDiv = contentDiv
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .trim();

    const content = contentDiv.split(/\n\n+/);

    return {
      title,
      content,
    };
  }
}
