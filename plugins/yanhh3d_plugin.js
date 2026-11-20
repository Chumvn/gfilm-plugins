var DEFAULT_BASE_URL = "https://yanhh3d.ee";

function _baseUrl() {
    if (typeof INJECTED_BASE_URL !== "undefined" && INJECTED_BASE_URL) {
        return String(INJECTED_BASE_URL).replace(/\/+$/, "");
    }
    if (typeof globalThis !== "undefined" && globalThis.__BASE_URL__) {
        return String(globalThis.__BASE_URL__).replace(/\/+$/, "");
    }
    return DEFAULT_BASE_URL;
}

function _absUrl(u) {
    if (!u) return "";
    u = String(u).trim();
    if (u.indexOf("http://") === 0 || u.indexOf("https://") === 0) return u;
    if (u.indexOf("//") === 0) return "https:" + u;
    var base = _baseUrl();
    return base + (u.charAt(0) === "/" ? "" : "/") + u;
}

function _toSlug(u) {
    u = _absUrl(u);
    var base = _baseUrl();
    if (u.indexOf(base) === 0) {
        u = u.substring(base.length);
    }
    return u.replace(/^\/+|\/+$/g, "");
}

function _cleanText(s) {
    if (!s) return "";
    return decodeHTMLtext(String(s)).replace(/\s+/g, " ").trim();
}

function getManifest() {
    return JSON.stringify({
        id: "yanhh3d",
        name: "YanHH3D",
        version: "1.0.0",
        description: "Hoạt Hình Trung Quốc 3D Thuyết Minh & VietSub 4K",
        iconUrl: "https://yanhh3d.ee/wp-content/uploads/2025/12/cropped-ff808081984378e80198450a293f07ec-large-300x300.png",
        author: "Chum",
        baseUrl: _baseUrl(),
        isEnabled: true,
        type: "movie",
        isAdult: false,
        sniffer: true,
        headers: {
            "Referer": _baseUrl() + "/"
        }
    });
}

function getHomeSections() {
    return JSON.stringify([
        { title: "Mới Cập Nhật", slug: "yanhh3d-moi-cap-nhat", type: "grid" },
        { title: "Top Xem Nhiều", slug: "top-yanhh3d-xem-nhieu", type: "carousel" },
        { title: "Hoàn Thành", slug: "yanhh3d-hoan-thanh", type: "grid" },
        { title: "Tu Tiên", slug: "tu-tien", type: "grid" },
        { title: "Tiên Hiệp", slug: "tien-hiep", type: "grid" },
        { title: "Kiếm Hiệp", slug: "kiem-hiep", type: "grid" },
        { title: "Xuyên Không", slug: "xuyen-khong", type: "grid" }
    ]);
}

function getUrlCategories() {
    return _baseUrl() + "/";
}

function parseCategoriesResponse(html, url) {
    var categories = [];
    var seen = {};
    var doc = _$(html);
    doc.find(".sb-genre-list li a").each(function (idx, el) {
        var name = _cleanText(el.text());
        var href = el.attr("href");
        var slug = _toSlug(href);
        if (name && slug && !seen[slug]) {
            seen[slug] = true;
            categories.push({ name: name, slug: slug });
        }
    });
    if (categories.length === 0) {
        categories = [
            { name: "Cổ Trang", slug: "co-trang" },
            { name: "Đô Thị", slug: "do-thi" },
            { name: "Hài Hước", slug: "hai-huoc" },
            { name: "Hiện Đại", slug: "hien-dai" },
            { name: "Kiếm Hiệp", slug: "kiem-hiep" },
            { name: "Tiên Hiệp", slug: "tien-hiep" },
            { name: "Trùng Sinh", slug: "trung-sinh" },
            { name: "Tu Tiên", slug: "tu-tien" },
            { name: "Xuyên Không", slug: "xuyen-khong" }
        ];
    }
    return JSON.stringify(categories);
}

function _parsePageNum(filtersJson) {
    var page = 1;
    if (filtersJson) {
        try {
            var f = typeof filtersJson === "string" ? JSON.parse(filtersJson) : filtersJson;
            if (f && f.page) page = parseInt(f.page, 10) || 1;
        } catch (e) {}
    }
    return page < 1 ? 1 : page;
}

function getUrlList(slug, filtersJson) {
    var page = _parsePageNum(filtersJson);
    var clean = String(slug || "yanhh3d-moi-cap-nhat").replace(/^\/+|\/+$/g, "");
    if (clean.indexOf("http") === 0) {
        clean = _toSlug(clean);
    }
    if (page > 1) {
        return _baseUrl() + "/" + clean + "/page/" + page;
    }
    return _baseUrl() + "/" + clean;
}

function getUrlSearch(keyword, filtersJson) {
    var page = _parsePageNum(filtersJson);
    var q = encodeURIComponent(String(keyword || "").trim());
    if (page > 1) {
        return _baseUrl() + "/page/" + page + "/?s=" + q;
    }
    return _baseUrl() + "/?s=" + q;
}

function _parseMovieCards(html) {
    var items = [];
    var seen = {};
    var doc = _$(html);
    doc.find(".flw-item").each(function (idx, el) {
        var linkEl = el.find("a.film-poster-ahref").first();
        if (!linkEl.length) linkEl = el.find("h3.film-name a").first();
        var href = _absUrl(linkEl.attr("href"));
        if (!href || seen[href]) return;
        seen[href] = true;

        var title = _cleanText(el.find("h3.film-name a").first().text());
        if (!title) title = _cleanText(linkEl.attr("title"));
        var imgEl = el.find("img.film-poster-img").first();
        if (!title) title = _cleanText(imgEl.attr("alt"));

        var poster = imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || imgEl.attr("src") || "";
        poster = _absUrl(poster);

        var epBadge = _cleanText(el.find(".tick-rate").first().text());
        var langBadge = _cleanText(el.find(".tick-sub").first().text());

        items.push({
            id: href,
            title: title || "Không rõ tên",
            posterUrl: poster,
            backdropUrl: poster,
            quality: "4K",
            episode_current: epBadge,
            lang: langBadge || "VietSub + TM",
            type: "series"
        });
    });

    var maxPage = 1;
    var pageRegex = /\/page\/(\d+)/g;
    var m;
    while ((m = pageRegex.exec(html)) !== null) {
        var p = parseInt(m[1], 10);
        if (p > maxPage) maxPage = p;
    }
    return { items: items, maxPage: maxPage };
}

function parseListResponse(html, url, filtersJson) {
    var page = _parsePageNum(filtersJson);
    var parsed = _parseMovieCards(html);
    var totalPages = parsed.maxPage > page ? parsed.maxPage : page;
    return JSON.stringify({
        items: parsed.items,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: parsed.items.length,
            itemsPerPage: parsed.items.length || 18
        }
    });
}

function parseSearchResponse(html, url, filtersJson) {
    return parseListResponse(html, url, filtersJson);
}

function getUrlDetail(id, datasend) {
    return _absUrl(id);
}

function parseMovieDetail(html, url, datasend) {
    var doc = _$(html);
    var title = _cleanText(doc.find("h1.film-name").first().text());
    var originName = _cleanText(doc.find(".film-name-real").first().text());
    var poster = _absUrl(doc.find(".anisc-poster img.film-poster-img").first().attr("src"));
    var desc = _cleanText(doc.find(".film-description .text").first().text());
    var status = _cleanText(doc.find(".movie-status").first().text());
    var duration = _cleanText(doc.find(".anisc-info .item-list").first().find(".name").first().text());

    var cats = [];
    doc.find(".anisc-info .item-cate a").each(function (idx, el) {
        var t = _cleanText(el.text());
        if (t) cats.push(t);
    });

    var rawEps = [];
    doc.find(".ep-range.ss-list a.ep-item").each(function (idx, el) {
        var epUrl = _absUrl(el.attr("href"));
        var epName = _cleanText(el.text());
        var postId = el.attr("data-post-id") || "";
        var epSlug = el.attr("data-ep") || "";
        if (epUrl && epName) {
            rawEps.push({
                name: epName,
                url: epUrl,
                postId: postId,
                epSlug: epSlug
            });
        }
    });

    // Nguồn xếp từ mới đến cũ, đảo lại thành Tập 1 -> Tập mới nhất nếu muốn
    if (rawEps.length > 1) {
        rawEps.reverse();
    }

    var latestEp = rawEps.length > 0 ? rawEps[rawEps.length - 1] : null;
    var serverDefs = [];
    if (latestEp && latestEp.url) {
        try {
            var watchRes = fetch(latestEp.url, {
                method: "GET",
                headers: {
                    "Referer": url || _baseUrl() + "/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });
            if (watchRes && watchRes.ok) {
                var watchHtml = watchRes.text();
                var watchDoc = _$(watchHtml);
                watchDoc.find("#list_sv .btn3dsv").each(function (idx, btn) {
                    var svType = btn.attr("data-type");
                    var svName = _cleanText(btn.text());
                    if (svType && svName) {
                        serverDefs.push({ name: svName, type: svType });
                    }
                });
            }
        } catch (e) {}
    }

    if (serverDefs.length === 0) {
        serverDefs = [
            { name: "VIETSUB 1080 V1", type: "tiktik" },
            { name: "VIETSUB 4K V1", type: "vip4k" },
            { name: "Thuyết Minh 1080 V1", type: "tiktm" },
            { name: "Thuyết Minh 4K V1", type: "vip4ktm" }
        ];
    }

    var servers = [];
    for (var s = 0; s < serverDefs.length; s++) {
        var sv = serverDefs[s];
        var epList = [];
        for (var i = 0; i < rawEps.length; i++) {
            var ep = rawEps[i];
            epList.push({
                name: ep.name,
                slug: ep.url + "?sv_type=" + sv.type,
                id: ep.url + "?sv_type=" + sv.type,
                datasend: JSON.stringify({
                    postId: ep.postId,
                    epSlug: ep.epSlug,
                    svType: sv.type,
                    watchUrl: ep.url
                }),
                sniffer: true
            });
        }
        servers.push({
            name: sv.name,
            episodes: epList
        });
    }

    return JSON.stringify({
        id: url || _absUrl(datasend),
        title: title || "Không rõ tên",
        originName: originName,
        posterUrl: poster,
        backdropUrl: poster,
        description: desc,
        quality: "4K",
        duration: duration,
        status: status,
        episode_current: latestEp ? latestEp.name : "",
        category: cats.join(", "),
        country: "Trung Quốc",
        lang: "VietSub + Thuyết Minh",
        type: "series",
        sniffer: true,
        servers: servers
    });
}

function getStreamLink(episodeUrl, datasend) {
    var payload = null;
    try {
        if (datasend && datasend.charAt(0) === "{") {
            payload = JSON.parse(datasend);
        }
    } catch (e) {}

    var watchUrl = (payload && payload.watchUrl) ? payload.watchUrl : String(episodeUrl || "").split("?sv_type=")[0];
    var svType = (payload && payload.svType) ? payload.svType : (getparam(String(episodeUrl || ""), "sv_type") || "tiktik");
    var postId = payload && payload.postId ? payload.postId : "";
    var epSlug = payload && payload.epSlug ? payload.epSlug : "";

    if ((!postId || !epSlug) && watchUrl) {
        try {
            var pageRes = fetch(watchUrl, { headers: { "Referer": _baseUrl() + "/" } });
            if (pageRes && pageRes.ok) {
                var wDoc = _$(pageRes.text());
                var activeEl = wDoc.find(".ssl-item.ep-item.active").first();
                if (!activeEl.length) activeEl = wDoc.find(".ssl-item.ep-item").first();
                postId = activeEl.attr("data-post-id") || postId;
                epSlug = activeEl.attr("data-ep") || epSlug;
            }
        } catch (e) {}
    }

    if (postId && epSlug) {
        var playerUrl = _baseUrl() + "/player/player.php?action=dox_ajax_player"
            + "&post_id=" + encodeURIComponent(postId)
            + "&chapter_st=" + encodeURIComponent(epSlug)
            + "&type=" + encodeURIComponent(svType)
            + "&sv=1";
        var pRes = fetch(playerUrl, {
            method: "GET",
            headers: {
                "Referer": watchUrl || (_baseUrl() + "/"),
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        if (pRes && pRes.ok) {
            var pHtml = pRes.text();
            var m3u8Match = pHtml.match(/https?:\/\/[^"'\\s<>]+\.(?:m3u8|mp4|mpd)[^"'\\s<>]*/i);
            if (m3u8Match) {
                return JSON.stringify({
                    url: m3u8Match[0],
                    isEmbed: false,
                    headers: { "Referer": watchUrl || (_baseUrl() + "/") }
                });
            }
            var iframeMatch = pHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch && iframeMatch[1]) {
                var embedUrl = _absUrl(iframeMatch[1]);
                if (embedUrl.indexOf("streamfree") !== -1 && typeof AppCrypto !== "undefined" && typeof AppCrypto.resolveStreamfree === "function") {
                    try {
                        var sfRaw = AppCrypto.resolveStreamfree(embedUrl, watchUrl || (_baseUrl() + "/"));
                        if (sfRaw && sfRaw.charAt(0) === "{") {
                            var sfObj = JSON.parse(sfRaw);
                            if (sfObj && sfObj.m3u8Url) {
                                return JSON.stringify({
                                    url: sfObj.m3u8Url,
                                    isEmbed: false,
                                    headers: sfObj.headers || { "Referer": "https://streamfree.vip/" }
                                });
                            }
                        }
                    } catch (e) {}
                }
                return JSON.stringify({
                    url: embedUrl,
                    isEmbed: true,
                    sniffer: true,
                    headers: { "Referer": watchUrl || (_baseUrl() + "/") }
                });
            }
        }
    }

    return JSON.stringify({
        url: watchUrl || _baseUrl(),
        isEmbed: true,
        sniffer: true,
        headers: { "Referer": _baseUrl() + "/" }
    });
}
