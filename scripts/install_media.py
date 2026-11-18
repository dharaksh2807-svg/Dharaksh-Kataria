#!/usr/bin/env python3
"""Validate the reviewed capture inventory and atomically register local media."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from urllib.parse import urlparse

MEDIA = Path(__file__).resolve().parents[1] / 'site' / 'assets' / 'media'
SLUGS = {p.stem for p in (MEDIA.parents[1] / 'projects').glob('*.html')}


def validate(catalog):
    if not shutil.which('ffprobe'):
        raise ValueError('ffprobe is required to validate capture dimensions and duration')
    for slug, items in catalog.items():
        if slug not in SLUGS or not isinstance(items, list):
            raise ValueError(f'Unknown project or invalid capture list: {slug}')
        for item in items:
            name = item.get('file', '')
            if not re.fullmatch(r'[A-Za-z0-9_-]+\.(png|webp|jpe?g|mp4|webm)', name):
                raise ValueError(f'Unsafe or unsupported filename: {name}')
            if item.get('approved') is not True or item.get('privacyReviewed') is not True:
                raise ValueError(f'Owner authorization and privacy review required: {name}')
            if not item.get('caption') or not item.get('captured'):
                raise ValueError(f'Caption and capture date required: {name}')
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', item['captured']):
                raise ValueError(f'Use YYYY-MM-DD capture dates: {name}')
            source = item.get('source')
            if slug == 'metro' and source:
                raise ValueError('Metro media must be owner-supplied with no repository or deployment URL')
            if source and (urlparse(source).scheme != 'https' or not urlparse(source).hostname):
                raise ValueError(f'Invalid public source: {name}')
            path = MEDIA / name
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest != item.get('sha256'):
                raise ValueError(f'Capture changed since review. Review again and update SHA-256: {name}')
            info = json.loads(subprocess.check_output([
                'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)
            ]))
            stream = next(s for s in info['streams'] if s['codec_type'] == 'video')
            if (stream['width'], stream['height']) != (item.get('width'), item.get('height')):
                raise ValueError(f'Dimensions do not match inventory: {name}')
            if item.get('type') == 'image':
                if not item.get('alt') or path.suffix not in ('.png', '.webp', '.jpg', '.jpeg'):
                    raise ValueError(f'Image alt text and image extension required: {name}')
            elif item.get('type') == 'video':
                if path.suffix not in ('.mp4', '.webm') or float(info['format']['duration']) > 60:
                    raise ValueError(f'Use a video of at most 60 seconds: {name}')
                if any(s['codec_type'] == 'audio' for s in info['streams']):
                    raise ValueError(f'This silent-walkthrough gallery requires audio-free video: {name}')
            else:
                raise ValueError(f'Unsupported media type: {name}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--confirm-authentic', action='store_true')
    args = parser.parse_args()
    if not args.confirm_authentic:
        sys.exit('Registration requires --confirm-authentic after authorization and visual privacy review.')
    try:
        catalog = json.loads((MEDIA / 'captures.json').read_text())
        validate(catalog)
        manifest = MEDIA / 'manifest.js'
        temporary = MEDIA / 'manifest.js.tmp'
        temporary.write_text('window.V8_MEDIA_MAP = ' + json.dumps(catalog, indent=2) + ';\n')
        temporary.replace(manifest)
    except (ValueError, OSError, KeyError, StopIteration, subprocess.SubprocessError) as error:
        sys.exit(f'No media registered. {error}')
    print(f'Registered {sum(map(len, catalog.values()))} reviewed captures across {len(catalog)} projects.')


if __name__ == '__main__':
    main()
