// ==MiruExtension==
// @name         RealmNovel
// @version      v0.0.2
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

    // استخراج قائمة الروايات
    const novelList = res.match(/<div class="novel-item">[\s\S]+?<\/div>/g);
    const novels = [];

    novelList.forEach((element) => {
      const url = element.match(/href="(.+?)"/)[1];
      const title = element.match(/title="(.+?)"/)[1].trim();
      const cover = element.match(/src="(.+?)"/)[1];

      novels.push({ title, url, cover });
    });
    return novels;
  }

  async search(kw, page) {
    const res = await this.request(`/search?q=${kw.replace(/\s+/g, '+')}`);
    const novelList = res.match(/<div class="relative">[\s\S]+?<\/div>/g);
    const novels = [];

    novelList.forEach((element) => {
      const url = element.match(/href="(.+?)"/)[1];
      const title = element.match(/title="(.+?)"/)[1].trim();
      const cover = element.match(/src="(.+?)"/)[1];

      novels.push({ title, url, cover });
    });
    return novels;
  }

  async detail(url) {
    const res = await this.request(url);

    const title = res.match(/<h1 class="md:text-4xl">([\s\S]+?)<\/h1>/)[1];
    const cover = res.match(/<img class="object-cover" src="(.+?)"/)[1];
    const desc = res.match(/<p class="md:text-lg">([\s\S]+?)<\/div>/)[1]
      .replace(/<[^>]+>/g, '')
      .trim();

    const episodes = [];
    const epiList = res.match(/<ul class="chapter-list">([\s\S]+?)<\/ul>/)[1].match(/<li>[\s\S]+?<\/li>/g);

    epiList.forEach((element) => {
      const name = element.match(/<a.*>(.+?)<\/a>/)[1];
      const url = element.match(/href="([^"]+)"/)[1];

      episodes.push({ name, url });
    });

    return {
      title,
      cover,
      desc,
      episodes: [
        {
          title: "الفصول",
          urls: episodes.reverse(),
        },
      ],
    };
  }

  async watch(url) {
    const res = await this.request(url);
    const title = res.match(/<h1 class="md:text-2xl">([\s\S]+?)<\/h1>/)[1];

    // استخراج المحتوى مع تجاوز الحماية
    const match = res.match(/<div class="chapter-content-card">([\s\S]+?)<\/div>/);
    let chapterContentDiv = match ? match[1] : "";

    chapterContentDiv = chapterContentDiv
      .replace(/<script[\s\S]+?<\/script>/g, '') // إزالة أي سكربتات حماية
      .replace(/<[^>]+>/g, '\n') // إزالة أكواد HTML
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/’/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .trim();

    const content = chapterContentDiv.split(/\n\n\n/g);

    return { title, content };
  }
}

// 🛑 إضافة حماية على محتوى الفصول في الموقع
document.addEventListener("DOMContentLoaded", function () {
    const chapterContent = document.querySelector(".chapter-content-card");
    if (chapterContent) {
        chapterContent.style.userSelect = "none"; // منع التحديد
        chapterContent.style.webkitUserSelect = "none";
        chapterContent.style.mozUserSelect = "none";
        chapterContent.style.msUserSelect = "none";

        document.addEventListener("copy", (e) => e.preventDefault()); // منع النسخ
        document.addEventListener("contextmenu", (e) => e.preventDefault()); // منع القائمة اليمنى
    }
});
