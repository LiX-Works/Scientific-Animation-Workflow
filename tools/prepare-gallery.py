"""Stage the static viewing site and readable documentation without adding videos to Git."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--video', required=True, type=Path, help='The selected v5 viewing MP4')
    parser.add_argument('--out', required=True, type=Path, help='New, empty staging directory')
    args = parser.parse_args()
    try:
        import markdown
    except ImportError:
        parser.error('Install tools/requirements.txt in your Python environment first.')
    video, output = args.video.resolve(), args.out.resolve()
    if not video.is_file() or video.suffix.lower() != '.mp4':
        parser.error('--video must be an existing MP4 file')
    if output == ROOT or ROOT in output.parents:
        parser.error('Use a staging directory outside the source repository')
    if output.exists() and not output.is_dir():
        parser.error('Staging output must be a directory')
    if output.exists() and any(output.iterdir()):
        parser.error('Staging directory must be new or empty; existing contents are preserved')
    output.mkdir(parents=True, exist_ok=True)
    for folder in ['gallery', 'assets', 'LICENSES']:
        shutil.copytree(ROOT / folder, output / folder, ignore=shutil.ignore_patterns('media', '__pycache__', '.DS_Store', 'Thumbs.db'))
    (output / 'gallery/media').mkdir(exist_ok=True)
    shutil.copy2(video, output / 'gallery/media/edl-gating-v5.mp4')
    for name in ['LICENSE', 'LICENSE-MEDIA.md', 'THIRD_PARTY_NOTICES.md']:
        shutil.copy2(ROOT / name, output / name)
    # Only documented public prose roots; never walk a film's local environment.
    sources = list(ROOT.glob('*.md')) + list((ROOT / 'docs').rglob('*.md'))
    for case in (ROOT / 'films').iterdir():
        if case.is_dir():
            sources.extend(case.glob('README*.md'))
            sources.extend((case / 'docs').rglob('*.md'))
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
        title = next((line.lstrip('# ').strip() for line in text.splitlines() if line.startswith('# ')), source.stem)
        relative_gallery = Path(__import__('os').path.relpath(output / 'gallery/index.html', target.parent)).as_posix()
        page = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        page += '<title>' + html.escape(title) + '</title><style>'
        page += 'body{max-width:900px;margin:0 auto;padding:32px 24px 80px;color:#203144;background:#fafbfd;font:17px/1.7 system-ui,sans-serif}a{color:#255da4}h1{font-size:2.25rem;line-height:1.2}h2{margin-top:2.5rem}img{max-width:100%;height:auto}pre{overflow:auto;background:#eaf0f6;padding:20px;border-radius:8px}code{font-size:.9em}table{display:block;overflow:auto;border-collapse:collapse}th,td{padding:10px;border:1px solid #dce3ec;text-align:left}nav{margin-bottom:32px;font-size:.9em}blockquote{margin-left:0;border-left:3px solid #6e92bd;padding-left:20px;color:#4d6179}'
        page += '</style><nav><a href="' + html.escape(relative_gallery) + '">← Scientific Animation Workflow</a></nav><main>' + body + '</main></html>'
        target.write_text(page, encoding='utf-8')
    gallery = output / 'gallery/index.html'
    text = gallery.read_text(encoding='utf-8')
    text = re.sub(r'href="([^"]+)\.md([#?][^"]*)?"', lambda m: 'href="' + m[1] + '.html' + (m[2] or '') + '"', text)
    gallery.write_text(text, encoding='utf-8')
    (output / 'index.html').write_text('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=gallery/index.html"><a href="gallery/index.html">Scientific Animation Workflow</a>', encoding='utf-8')
    digest_state = hashlib.sha256()
    with video.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest_state.update(block)
    digest = digest_state.hexdigest()
    manifest = {'video': 'edl-gating-v5.mp4', 'bytes': video.stat().st_size, 'sha256': digest, 'license': 'CC-BY-4.0', 'credit': 'Scientific Animation Workflow contributors'}
    (output / 'gallery/media/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    (output / '.nojekyll').write_text('', encoding='utf-8')
    print(json.dumps({'directory': str(output), 'view': 'gallery/index.html', 'video': manifest}, indent=2))


if __name__ == '__main__':
    main()
