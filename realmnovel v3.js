// ==MiruExtension==
// @name         RealmNovel
// @version      v1.1.0
// @author       Amr
// @lang         ar
// @license      MIT
// @icon         https://www.realmnovel.com/favicon.ico
// @package      realm.novel
// @type         fikushon
// @webSite      https://www.realmnovel.com
// @nsfw         false
// ==/MiruExtension==

export default class RealmNovel extends Extension {
  async latest() {
    const res = await this.request("/");

    // استخراج الروايات بناءً على الهيكلة الجديدة للصفحة
    const novelList = res.match(/<div class="novel-item[^"]*">[\s\S]+?<\/div>/g);
    if (!novelList) return []; // تجنب الخطأ إذا لم يتم العثور على بيانات

    const novels = novelList.map(element => {
      const urlMatch = element.match(/<a[^>]+href="([^"]+)"/);
      const titleMatch = element.match(/<h2[^>]*>([\s\S]+?)<\/h2>/);
      const coverMatch = element.match(/<img[^>]+src="([^"]+)"/);

      if (!urlMatch || !titleMatch || !coverMatch) return null;

      return {
        title: titleMatch[1].trim(),
        url: urlMatch[1].startsWith("http") ? urlMatch[1] : `https://www.realmnovel.com${urlMatch[1]}`,
        cover: coverMatch[1].startsWith("http") ? coverMatch[1] : `https://www.realmnovel.com${coverMatch[1]}`,
      };
    }).filter(novel => novel !== null);

    return novels;
  }

  async search(kw, page) {
    const res = await this.request(`/search?q=${encodeURIComponent(kw)}`);
    const novelList = res.match(/<div class="novel-item[^"]*">[\s\S]+?<\/div>/g);
    if (!novelList) return [];

    const novels = novelList.map(element => {
      const urlMatch = element.match(/<a[^>]+href="([^"]+)"/);
      const titleMatch = element.match(/<h2[^>]*>([\s\S]+?)<\/h2>/);
      const coverMatch = element.match(/<img[^>]+src="([^"]+)"/);

      if (!urlMatch || !titleMatch || !coverMatch) return null;

      return {
        title: titleMatch[1].trim(),
        url: urlMatch[1].startsWith("http") ? urlMatch[1] : `https://www.realmnovel.com${urlMatch[1]}`,
        cover: coverMatch[1].startsWith("http") ? coverMatch[1] : `https://www.realmnovel.com${coverMatch[1]}`,
      };
    }).filter(novel => novel !== null);

    return novels;
  }

  async detail(url) {
    const res = await this.request(url);

    const titleMatch = res.match(/<h1[^>]*>([\s\S]+?)<\/h1>/);
    const coverMatch = res.match(/<img class="cover" src="([^"]+)"/);
    const descMatch = res.match(/<div class="description">([\s\S]+?)<\/div>/);
    const episodeListMatch = res.match(/<ul class="chapter-list">([\s\S]+?)<\/ul>/);

    if (!titleMatch || !coverMatch || !descMatch || !episodeListMatch) return null;

    const title = titleMatch[1].trim();
    const cover = coverMatch[1].startsWith("http") ? coverMatch[1] : `https://www.realmnovel.com${coverMatch[1]}`;
    const desc = descMatch[1].replace(/<[^>]+>/g, '').trim();

    const episodes = [];
    const epiList = episodeListMatch[1].match(/<li>[\s\S]+?<\/li>/g) || [];

    epiList.forEach(element => {
      const nameMatch = element.match(/<a[^>]*>([\s\S]+?)<\/a>/);
      const urlMatch = element.match(/<a[^>]+href="([^"]+)"/);

      if (nameMatch && urlMatch) {
        episodes.push({
          name: nameMatch[1].trim(),
          url: urlMatch[1].startsWith("http") ? urlMatch[1] : `https://www.realmnovel.com${urlMatch[1]}`,
        });
      }
    });

    return {
      title,
      cover,
      desc,
      episodes: [{ title: "الفصول", urls: episodes.reverse() }],
    };
  }

  async watch(url) {
    const res = await this.request(url);
    const titleMatch = res.match(/<h1[^>]*>([\s\S]+?)<\/h1>/);
    const match = res.match(/<div class="chapter-content">([\s\S]+?)<\/div>/);

    if (!titleMatch || !match) return null;

    let chapterContentDiv = match[1];

    chapterContentDiv = chapterContentDiv
      .replace(/<[^>]+>/g, '\n')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/’/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .trim();

    const content = chapterContentDiv.split(/\n\n+/g);

    return { title: titleMatch[1].trim(), content };
  }
}
