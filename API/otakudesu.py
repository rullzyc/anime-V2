import requests
from bs4 import BeautifulSoup
from API.extractor.desudrive import desudrive
import base64
import json

host = "https://otakudesu.blog/"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

# Override requests.get to always use headers
original_get = requests.get
def custom_get(url, **kwargs):
    if 'headers' not in kwargs:
        kwargs['headers'] = headers
    return original_get(url, **kwargs)
requests.get = custom_get

AJAX_URL = "https://otakudesu.blog/wp-admin/admin-ajax.php"
_nonce_cache = None

def _get_nonce():
    global _nonce_cache
    if _nonce_cache:
        return _nonce_cache
    res = requests.post(AJAX_URL, data={"action": "aa1208d27f29ca340c92c66d1926f13f"}, headers=headers)
    _nonce_cache = res.json().get("data")
    return _nonce_cache

def getStreams(episode_url):
    """Fetch available stream mirror URLs for all qualities from an episode page."""
    page = BeautifulSoup(requests.get(episode_url).text, features="html.parser")
    mirror = page.find('div', class_='mirrorstream')
    if not mirror:
        return {}

    nonce = _get_nonce()
    streams = {}  # { "480p": { "updesu": "https://...", ... }, "720p": {...} }

    for ul in mirror.find_all('ul'):
        # class is like 'm480p', 'm720p', etc.
        cls = ul.get('class', [''])[0]
        quality = cls.lstrip('m')  # "480p", "720p"
        streams[quality] = {}

        for a in ul.find_all('a'):
            data_b64 = a.get('data-content', '')
            server = a.text.strip()
            if not data_b64:
                continue
            try:
                payload = json.loads(base64.b64decode(data_b64).decode())
                res = requests.post(AJAX_URL, data={
                    **payload,
                    "nonce": nonce,
                    "action": "2a3505c93b0035d3f455df82bf976b84"
                }, headers=headers)
                iframe_html = base64.b64decode(res.json().get("data", "")).decode()
                soup_iframe = BeautifulSoup(iframe_html, "html.parser")
                iframe = soup_iframe.find('iframe')
                if iframe and iframe.get('src'):
                    streams[quality][server] = iframe['src']
            except Exception as e:
                streams[quality][server] = f"error:{e}"

    return streams

def getSchedule():
    schedule = {}
    for page_num in range(1, 4):
        try:
            animes = getOngoing(page_num)
            for a in animes:
                day = a.get("hari", "Lainnya")
                if not day:
                    day = "Lainnya"
                if day not in schedule:
                    schedule[day] = []
                if not any(existing['url'] == a['url'] for existing in schedule[day]):
                    schedule[day].append(a)
        except Exception:
            pass
    return schedule

def getOngoing(next_page=1):
	data = BeautifulSoup(requests.get(host + f"ongoing-anime/page/{next_page}/").text, features="html.parser")
	ret = []

	animelists = data.find('div', {'class': 'venz'})
	for anime in animelists.findAll("li"):
		title = anime.find('h2', {"class": "jdlflm"}).text
		eps = anime.find('div', {"class": "epz"}).text
		img = anime.find('img')['src']
		hari = anime.find('div', {"class": "epztipe"}).text.strip()
		url = anime.find('a')['href']
		ret.append({"title": title, "eps": eps, "img": img, "hari": hari, "url": url})

	return ret


def getGenreList():
	r = BeautifulSoup(requests.get(host + "genre-list/").content, features="html.parser")
	genres = {}
	for data in r.find('ul', {"class": "genres"}).li.findAll("a"):
		genres[data.text] = data['href']
	return genres


def getGenreAnime(genre_path):
	r = BeautifulSoup(requests.get(host + genre_path).content, features="html.parser")
	data = []
	for anime in r.findAll('div', {"class": "col-anime"}):
		title = anime.find('div', {"class": "col-anime-title"}).text
		url = anime.find('div', {"class": "col-anime-title"}).a['href']
		eps = anime.find('div', {"class": "col-anime-eps"}).text
		img = anime.find('div', {"class": "col-anime-cover"}).img['src']
		data.append({"title": title, "eps": eps, "img": img, "hari": "", "url": url})
	return data


def getEpisodes(url):
	data = BeautifulSoup(requests.get(url).text, features="html.parser")
	ret = {'title': data.find('div', {"class": "jdlrx"}).text, 'cover': data.find('img', {'class': 'attachment-post-thumbnail'})['src'], 'sinopsis': "\n\n".join([x.text for x in data.find('div', {'class': 'sinopc'}).findAll('p')]), "info": "\n".join([x.text for x in data.find("div", {"class": "infozingle"}).findAll('p')]), "episodes": []}

	epslists = data.findAll('div', {'class': 'episodelist'})
	for chlists in epslists:
		for eps in chlists.findAll("li"):
			title = eps.find('a').text
			url = eps.find('a')['href']
			date = eps.find('span', {"class": "zeebr"}).text
			ret['episodes'].append({"title": title, "url": url, "date": date})

	ret['recommend'] = []
	recommendationData = data.find("div", {"class": "isi-recommend-anime-series"}).findAll("div", {"class": "isi-konten"})
	for reclist in recommendationData:
		title = reclist.span.text
		url = reclist.a['href']
		cover = reclist.img['src']
		ret['recommend'].append({"title": title, "url": url, "cover": cover})

	return ret


def getDownload(url):
	data = BeautifulSoup(requests.get(url).text, features="html.parser")
	ret = {}

	# Extract stream link
	iframe_container = data.find('div', {'class': 'responsive-embed-stream'})
	if iframe_container and iframe_container.find('iframe'):
		ret['stream_url'] = iframe_container.find('iframe')['src']

	download = data.find('div', {'class': 'download'})
	if download:
		for dlurl in download.findAll("li"):
			filetype = dlurl.strong.text
			fileurl = ""
			for urlname in dlurl.findAll("a"):
				if "kfiles" in urlname.text.lower():
					fileurl = urlname['href']
					if "desudrive" in fileurl:
						fileurl = desudrive(fileurl)
			if not fileurl:
				fileurl = dlurl.a['href']
			ret[filetype] = fileurl
	elif batchlink := data.find('div', {'class': 'batchlink'}):
		for dlurl in batchlink.findAll("li"):
			filetype = dlurl.strong.text
			fileurl = ""
			for urlname in dlurl.findAll("a"):
				if "kfiles" in urlname.text.lower():
					fileurl = urlname['href']
					if "desudrive" in fileurl:
						fileurl = desudrive(fileurl)
			if not fileurl:
				fileurl = dlurl.a['href']
			ret[filetype] = fileurl

	return ret


def searchAnime(title):
	a = BeautifulSoup(requests.get(host + "/?s={}&post_type=anime".format(title)).content, features="html.parser")
	s = a.find("ul", {"class": "chivsrc"}).findAll("li")
	data = []
	for x in s:
		data.append({"title": x.h2.text, "img": x.img['src'], "url": x.h2.a['href']})
	
	return data
