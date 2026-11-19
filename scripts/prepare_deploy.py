#!/usr/bin/env python3
"""Prepare canonical/social URLs and a sitemap for an owner-approved real HTTPS origin."""
from pathlib import Path
from urllib.parse import urlparse
from xml.etree.ElementTree import Element, SubElement, ElementTree, register_namespace
import argparse
import re

root = Path(__file__).resolve().parents[1] / "site"
parser = argparse.ArgumentParser(description="Prepare static portfolio metadata")
parser.add_argument("--origin", required=True, help="Actual HTTPS portfolio domain without path")
args = parser.parse_args()
origin = args.origin.rstrip("/")
parsed = urlparse(origin)
if (parsed.scheme != "https" or not parsed.netloc or parsed.path or parsed.query
        or parsed.fragment or "YOUR-" in origin.upper()):
    raise SystemExit("Provide a real HTTPS origin, such as https://portfolio.example.com")

files = [root / "index.html", *sorted((root / "projects").glob("*.html"))]
urls = []
for file in files:
    url = origin + ("/" if file.name == "index.html" else "/projects/" + file.name)
    text = file.read_text(encoding="utf-8")
    # Idempotent: old generated tags are removed before inserting one canonical/URL pair.
    text = re.sub(r'<link rel="canonical" href="[^"]*">', "", text)
    text = re.sub(r'<meta property="og:url" content="[^"]*">', "", text)
    text = text.replace("</head>",
        f'<link rel="canonical" href="{url}"><meta property="og:url" content="{url}"></head>', 1)
    image_url = origin + ("/assets/og-cover.png" if file.name == "index.html"
                          else "/assets/og/" + file.stem + ".png")
    text = re.sub(
        r'(<meta (?:property="og:image"|name="twitter:image") content=")[^"]+(")',
        lambda m: m.group(1) + image_url + m.group(2), text)
    file.write_text(text, encoding="utf-8")
    urls.append(url)

namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
register_namespace("", namespace)
root_element = Element("{" + namespace + "}urlset")
for url in urls:
    item = SubElement(root_element, "{" + namespace + "}url")
    SubElement(item, "{" + namespace + "}loc").text = url
ElementTree(root_element).write(root / "sitemap.xml", encoding="utf-8", xml_declaration=True)
(root / "robots.txt").write_text("User-agent: *\nAllow: /\nSitemap: " + origin + "/sitemap.xml\n",
                                  encoding="utf-8")
print("Prepared", len(urls), "indexed routes with canonical/social metadata and sitemap for", origin)
