"""Stage the static viewing site and readable documentation without adding videos to Git."""
import argparse
import hashlib
import html
import json
import os
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / 'site'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--video', required=True, type=Path, help='The MP4 selected by films/edl-gating/release.json')
    parser.add_argument('--extra-video', action='append', default=[], type=Path, help="Another film's verified MP4, placed in gallery/media")
    parser.add_argument('--out', required=True, type=Path, help='New, empty staging directory')
    args = parser.parse_args()
    try:
        import markdown
    except ImportError:
        parser.error('Install site/tools/requirements.txt in your Python environment first.')
    video, output = args.video.resolve(), args.out.resolve()
    if not video.is_file() or video.suffix.lower() != '.mp4':
        parser.error('--video must be an existing MP4 file')
    for extra in args.extra_video:
        if not extra.is_file() or extra.suffix.lower() != '.mp4':
            parser.error('--extra-video must be an existing MP4 file')
    if output == ROOT or ROOT in output.parents:
        parser.error('Use a staging directory outside the source repository')
    if output.exists() and not output.is_dir():
        parser.error('Staging output must be a directory')
    if output.exists() and any(output.iterdir()):
        parser.error('Staging directory must be new or empty; existing contents are preserved')
    release_path = ROOT / 'films/edl-gating/release.json'
    release = json.loads(release_path.read_text(encoding='utf-8'))
    selected = release['video']
    filename = selected['filename']
    if Path(filename).name != filename or not filename.endswith('.mp4'):
        parser.error('Release metadata must contain a plain MP4 filename')
    digest_state = hashlib.sha256()
    with video.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest_state.update(block)
    digest = digest_state.hexdigest()
    if video.stat().st_size != selected['bytes'] or digest != selected['sha256']:
        parser.error('MP4 size or SHA-256 does not match the selected release; nothing was staged')
    output.mkdir(parents=True, exist_ok=True)
    ignore = shutil.ignore_patterns('media', '__pycache__', '.DS_Store', 'Thumbs.db')
    # The published layout stays gallery/ and assets/ at the top, so existing public addresses do not change.
    for folder in ['gallery', 'assets']:
        shutil.copytree(SITE / folder, output / folder, ignore=ignore)
    shutil.copytree(ROOT / 'docs/legal/LICENSES', output / 'docs/legal/LICENSES', ignore=ignore)
    (output / 'gallery/media').mkdir(exist_ok=True)
    shutil.copy2(video, output / 'gallery/media' / filename)
    for extra in args.extra_video:
        shutil.copy2(extra, output / 'gallery/media' / extra.name)
    staged_release = output / 'films/edl-gating/release.json'
    staged_release.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(release_path, staged_release)
    shutil.copy2(ROOT / 'LICENSE', output / 'LICENSE')
    # Only documented public prose roots; never walk a film's local environment.
    sources = list((ROOT / 'docs').rglob('*.md'))
    for case in (ROOT / 'films').iterdir():
        if case.is_dir():
            sources.extend(case.glob('README*.md'))
            sources.extend((case / 'docs').rglob('*.md'))
            if (case / 'release.json').is_file():
                (output / 'films' / case.name).mkdir(parents=True, exist_ok=True)
                shutil.copy2(case / 'release.json', output / 'films' / case.name / 'release.json')
            if (case / 'assets').is_dir():
                shutil.copytree(case / 'assets', output / 'films' / case.name / 'assets', dirs_exist_ok=True)
    for source in sources:
        target = output / source.relative_to(ROOT).with_suffix('.html')
        target.parent.mkdir(parents=True, exist_ok=True)
        text = source.read_text(encoding='utf-8')
        body = markdown.markdown(text.replace('<details>', '<details markdown="1">'), extensions=['tables', 'fenced_code', 'toc', 'md_in_html'])
        def local_markdown_link(match):
            value = match.group(1)
            if re.match(r'^[a-zA-Z][\w+.-]*:', value):
                return match.group(0)
            return 'href="' + re.sub(r'\.md(?=[#?]|$)', '.html', value) + '"'
        body = re.sub(r'href="([^"]+)"', local_markdown_link, body)
        body = body.replace('site/assets/', 'assets/')
        title = next((line.lstrip('# ').strip() for line in text.splitlines() if line.startswith('# ')), source.stem)
        relative_gallery = Path(os.path.relpath(output / 'gallery/index.html', target.parent)).as_posix()
        language = 'zh-CN' if re.search(r'(?:^|[._-])zh(?:[._-]|$)', source.stem, re.I) else 'en'
        page = '<!doctype html><html lang="' + language + '"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        page += '<title>' + html.escape(title) + '</title><style>'
        page += 'body{max-width:900px;margin:0 auto;padding:32px 24px 80px;color:#203144;background:#fafbfd;font:17px/1.7 system-ui,sans-serif}a{color:#255da4}h1{font-size:2.25rem;line-height:1.2}h2{margin-top:2.5rem}img{max-width:100%;height:auto}pre{overflow:auto;background:#eaf0f6;padding:20px;border-radius:8px}code{font-size:.9em}table{display:block;overflow:auto;border-collapse:collapse}th,td{padding:10px;border:1px solid #dce3ec;text-align:left}nav{margin-bottom:32px;font-size:.9em}blockquote{margin-left:0;border-left:3px solid #6e92bd;padding-left:20px;color:#4d6179}'
        page += '</style><nav><a href="' + html.escape(relative_gallery) + '">← Scientific Animation Workflow</a></nav><main>' + body + '</main></html>'
        target.write_text(page, encoding='utf-8')
    gallery = output / 'gallery/index.html'
    text = gallery.read_text(encoding='utf-8')
    text = re.sub(r'href="([^"]+)\.md([#?][^"]*)?"', lambda m: 'href="' + m[1] + '.html' + (m[2] or '') + '"', text)
    gallery.write_text(text, encoding='utf-8')
    (output / 'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scientific Animation Workflow</title><meta http-equiv="refresh" content="0;url=gallery/index.html"><a href="gallery/index.html">Scientific Animation Workflow</a></html>', encoding='utf-8')
    manifest = {'release': release['tag'], 'video': filename, 'bytes': video.stat().st_size, 'sha256': digest, 'duration_seconds': selected['duration_seconds'], 'on_screen_language': selected['on_screen_language'], 'license': release['license'], 'credit': release['credit']}
    (output / 'gallery/media/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    (output / '.nojekyll').write_text('', encoding='utf-8')
    print(json.dumps({'directory': str(output), 'view': 'gallery/index.html', 'video': manifest}, indent=2))


if __name__ == '__main__':
    main()
