// ==MiruExtension==
// @name         RealmNovel
// @version      v1.0.0
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

    // استخراج قائمة الروايات الجديدة
    const novelList = res.match(/<div class="group relative flex flex-col overflow-hidden rounded bg-card p-3">[\s\S]+?<\/div>/g);
    const novels = [];

    novelList.forEach((element) => {
      const url = element.match(/href="(.+?)"/)?.[1] || "";
      const title = element.match(/alt="(.+?)"/)?.[1].trim() || "عنوان غير معروف";
      const cover = element.match(/src="(.+?)"/)?.[1] || "";

      if (url) {
        novels.push({ title, url, cover });
      }
    });

    return novels;
  }

  async search(kw) {
    const res = await this.request(`/search?q=${kw.replace(/\s+/g, '+')}`);
    const novelList = res.match(/<div class="group relative flex flex-col overflow-hidden rounded bg-card p-3">[\s\S]+?<\/div>/g);
    const novels = [];

    novelList.forEach((element) => {
      const url = element.match(/href="(.+?)"/)?.[1] || "";
      const title = element.match(/alt="(.+?)"/)?.[1].trim() || "عنوان غير معروف";
      const cover = element.match(/src="(.+?)"/)?.[1] || "";

      if (url) {
        novels.push({ title, url, cover });
      }
    });

    return novels;
  }

  async detail(url) {
    const res = await this.request(url);

    // استخراج معلومات الرواية
    const title = res.match(/<h1 class="text-4xl font-bold">([\s\S]+?)<\/h1>/)?.[1].trim() || "عنوان غير معروف";
    const cover = res.match(/<img class="object-cover" src="(.+?)"/)?.[1] || "";
    const desc = res.match(/<div class="my-4 text-muted-foreground">([\s\S]+?)<\/div>/)?.[1].replace(/<[^>]+>/g, '').trim() || "لا يوجد وصف.";

    // استخراج الفصول
    const episodes = [];
    const epiList = res.match(/<a class="block w-full truncate rounded p-2 text-start transition-all hover:bg-primary"[\s\S]+?<\/a>/g) || [];

    epiList.forEach((element) => {
      const name = element.match(/>([^<]+)<\/a>/)?.[1].trim() || "فصل غير معروف";
      const url = element.match(/href="([^"]+)"/)?.[1] || "";

      if (url) {
        episodes.push({ name, url });
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

    // استخراج اسم الفصل
    const title = res.match(/<h1 class="text-2xl font-bold">([\s\S]+?)<\/h1>/)?.[1].trim() || "عنوان غير معروف";

    // استخراج محتوى الفصل مع تجاوز الحماية
    const match = res.match(/<div class="prose max-w-none">([\s\S]+?)<\/div>/);
    let chapterContent = match ? match[1] : "لم يتم العثور على المحتوى.";

    chapterContent = chapterContent
      .replace(/<[^>]+>/g, '\n') // إزالة أكواد HTML
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/’/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .trim();

    return { title, content: chapterContent.split(/\n\n/g) };
  }
}
