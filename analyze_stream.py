import requests
from bs4 import BeautifulSoup
import re
import base64
import json

url = 'https://otakudesu.blog/episode/snwbe-episode-5-sub-indo/'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'}
html = requests.get(url, headers=headers).text
soup = BeautifulSoup(html, 'html.parser')

# Get mirror stream div
mirror = soup.find('div', class_='mirrorstream')
print("Mirror stream HTML found:", bool(mirror))

# Get all stream links and their base64 data
if mirror:
    for ul in mirror.find_all('ul'):
        quality = ul.get('class', ['unknown'])[0]
        print(f"\nQuality: {quality}")
        for a in ul.find_all('a'):
            data = a.get('data-content', '')
            server = a.text.strip()
            if data:
                try:
                    decoded = base64.b64decode(data).decode()
                    print(f"  Server: {server}, Data: {decoded}")
                except:
                    print(f"  Server: {server}, Data (raw): {data}")

# Find ajax action key from scripts
scripts = soup.find_all('script')
for s in scripts:
    text = s.string or ''
    if 'aa1208' in text or 'ajax' in text:
        print("\n--- AJAX SCRIPT ---")
        print(text[:1000])
