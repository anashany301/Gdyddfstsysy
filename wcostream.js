// ==MiruExtension==
// @name         Wcostream
// @version      v0.0.1
// @author       Anas
// @lang         en
// @type         video
// @icon         https://www.wcostream.tv/inc/embed/assets/images/wco-logo.png
// @package      com.anas.wcostream
// @webSite      https://www.wcostream.tv
// @ns           wcostream
// ==/MiruExtension==

import { Extension } from "miru-script";

export default class extends Extension {
  async latest(page) {
    const res = await this.request(`/last-50-recent-release?page=${page}`);
    const cheerio = await this.loadCheerio(res);
    const cards = [];

    cheerio(".ddmcc ul li").each((_, element) => {
      const a = cheerio(element).find("a");
      const title = a.text().trim();
      const url = a.attr("href");
      
      if (title && url) {
        cards.push({
          title,
          url,
          cover: "https://www.wcostream.tv/inc/embed/assets/images/wco-logo.png"
        });
      }
    });

    return cards;
  }

  async search(kw, page) {
    const res = await this.request(`/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: `catara=${encodeURIComponent(kw)}&konfirmasi=Search`
    });

    const cheerio = await this.loadCheerio(res);
    const results = [];

    cheerio(".ddmcc ul li").each((_, element) => {
      const a = cheerio(element).find("a");
      const title = a.text().trim();
      const url = a.attr("href");

      if (title && url) {
        results.push({
          title,
          url,
          cover: "https://www.wcostream.tv/inc/embed/assets/images/wco-logo.png"
        });
      }
    });

    return results;
  }

  async detail(url) {
    const res = await this.request(url);
    const cheerio = await this.loadCheerio(res);

    const title = cheerio(".single-title").text().trim() || "Wcostream Cartoon";
    const cover = cheerio("#cat-img-desc img").attr("src") || "https://www.wcostream.tv/inc/embed/assets/images/wco-logo.png";
    const desc = cheerio("#sidebar_right p").text().trim() || "No description available";

    const episodes = [];
    cheerio("#cat-series .manga-titles a, .ddmcc ul li a").each((_, element) => {
      const epTitle = cheerio(element).text().trim();
      const epUrl = cheerio(element).attr("href");

      if (epTitle && epUrl) {
        episodes.push({
          title: epTitle,
          urls: [
            {
              name: "WCO Server",
              url: epUrl
            }
          ]
        });
      }
    });

    return {
      title,
      cover,
      desc,
      episodes: [
        {
          title: "Episodes",
          urls: episodes.map(e => e.urls[0])
        }
      ]
    };
  }

  async watch(url) {
    const res = await this.request(url);
    const iframeSrc = res.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];

    if (!iframeSrc) {
      throw new Error("Video player not found");
    }

    const iframeRes = await this.request(iframeSrc);
    const videoUrl = iframeRes.match(/file:\s*["']([^"']+\.mp4[^"']*)["']/i)?.[1] || 
                     iframeRes.match(/source\s*src=["']([^"']+)["']/i)?.[1];

    if (!videoUrl) {
      throw new Error("Unable to extract direct video link");
    }

    return {
      type: "mp4",
      url: videoUrl
    };
  }
}
