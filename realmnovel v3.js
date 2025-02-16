export default class extends Extension {
  constructor() {
    super("RealmNovel", "https://www.realmnovel.com", "ar");
  }

  async latest() {
    const res = await this.request("/");
    const novelList = res.match(/<div class="novel-item">[\s\S]+?<\/div>/g);
    if (!novelList) return [];

    return novelList.map(element => {
      const urlMatch = element.match(/href="(.+?)"/);
      const titleMatch = element.match(/title="(.+?)"/);
      const coverMatch = element.match(/src="(.+?)"/);

      if (!urlMatch || !titleMatch || !coverMatch) return null;

      return {
        title: titleMatch[1].trim(),
        url: `https://www.realmnovel.com${urlMatch[1]}`,
        cover: coverMatch[1],
      };
    }).filter(novel => novel !== null);
  }

  async search(kw, page) {
    const res = await this.request(`/search?q=${encodeURIComponent(kw)}`);
    const novelList = res.match(/<div class="relative">[\s\S]+?<\/div>/g);
    if (!novelList) return [];

    return novelList.map(element => {
      const urlMatch = element.match(/href="(.+?)"/);
      const titleMatch = element.match(/title="(.+?)"/);
      const coverMatch = element.match(/src="(.+?)"/);

      if (!urlMatch || !titleMatch || !coverMatch) return null;

      return {
        title: titleMatch[1].trim(),
        url: `https://www.realmnovel.com${urlMatch[1]}`,
        cover: coverMatch[1],
      };
    }).filter(novel => novel !== null);
  }

  async detail(url) {
    const res = await this.request(url);

    const titleMatch = res.match(/<h1 class="md:text-4xl">([\s\S]+?)<\/h1>/);
    const coverMatch = res.match(/<img class="object-cover" src="(.+?)"/);
    const descMatch = res.match(/<p class="md:text-lg">([\s\S]+?)<\/div>/);
    const episodeListMatch = res.match(/<ul class="chapter-list">([\s\S]+?)<\/ul>/);

    if (!titleMatch || !coverMatch || !descMatch || !episodeListMatch) return null;

    const title = titleMatch[1].trim();
    const cover = coverMatch[1];
    const desc = descMatch[1].replace(/<[^>]+>/g, '').trim();

    const episodes = [];
    const epiList = episodeListMatch[1].match(/<li>[\s\S]+?<\/li>/g) || [];

    epiList.forEach(element => {
      const nameMatch = element.match(/<a.*>(.+?)<\/a>/);
      const urlMatch = element.match(/href="([^"]+)"/);

      if (nameMatch && urlMatch) {
        episodes.push({
          name: nameMatch[1].trim(),
          url: `https://www.realmnovel.com${urlMatch[1]}`,
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
    const titleMatch = res.match(/<h1 class="md:text-2xl">([\s\S]+?)<\/h1>/);
    const match = res.match(/<div class="chapter-content-card">[\s\S]+?<div[^>]*>([\s\S]+?)<\/div>/);

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

    const content = chapterContentDiv.split(/\n\n\n/g);

    return { title: titleMatch[1].trim(), content };
  }
}
