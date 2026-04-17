#!/usr/bin/env python3
"""
Generate logo-data.js from repository structure
This script scans the logos/ directory, reads metadata.md files for each product
folder, and generates the logo-data.js file used by the GitHub Pages interface.
"""

import os
import json
import re
import subprocess
import urllib.request
from pathlib import Path
from datetime import datetime

# Configuration
REPO_ROOT = Path(__file__).parent
LOGOS_DIR = REPO_ROOT / "logos"
DOCS_DIR = REPO_ROOT / "docs"
OUTPUT_FILE = DOCS_DIR / "js" / "logo-data.js"

# File extensions to include
LOGO_EXTENSIONS = {'.png', '.svg', '.jpg', '.jpeg', '.ico'}

# Files to skip when scanning for logo images
SKIP_FILES = {'metadata.md'}


def get_file_format(filename):
    """Extract file format from filename"""
    ext = Path(filename).suffix.upper()
    return ext[1:] if ext else ''


def parse_metadata(metadata_path):
    """Parse a metadata.md file and return a dict of its fields."""
    metadata = {
        'name': '',
        'type': '',
        'status': '',
        'altnames': '',
        'prodfamilies': ''
    }
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                for key in metadata:
                    if line.lower().startswith(key + ':'):
                        metadata[key] = line[len(key) + 1:].strip()
                        break
    except Exception as e:
        print(f"  Warning: Could not read {metadata_path}: {e}")
    return metadata


def find_nearest_metadata(file_path, logos_dir):
    """Walk up from file_path toward logos_dir looking for the nearest metadata.md."""
    current = file_path.parent
    while current != logos_dir and str(current).startswith(str(logos_dir)):
        md_path = current / 'metadata.md'
        if md_path.exists():
            return md_path
        current = current.parent
    return None


def fallback_name_from_folder(folder_name):
    """Generate a display name from a folder name when no metadata exists."""
    name = folder_name.replace('-', ' ').replace('_', ' ')
    name = re.sub(r'\s+', ' ', name).strip()
    # Capitalise words, keeping certain words lowercase
    keep_lower = {'and', 'or', 'the', 'of', 'for', 'in'}
    words = name.split()
    return ' '.join(
        w if w.lower() in keep_lower and i > 0 else w.capitalize()
        for i, w in enumerate(words)
    )


def determine_style(rel_path_str):
    """Determine logo style from the path components."""
    path_lower = rel_path_str.lower()
    if 'monochrome-negative' in path_lower or 'monochromatic-negative' in path_lower:
        return 'monochrome-negative'
    if 'monochrome-positive' in path_lower or 'monochromatic-positive' in path_lower:
        return 'monochrome-positive'
    if 'monochrome' in path_lower or 'monochromatic' in path_lower:
        return 'monochrome'
    if 'negative' in path_lower:
        return 'negative'
    if 'positive' in path_lower:
        return 'positive'
    return 'full-color'


def determine_year(path_parts):
    """Extract year/era from folder names in the path."""
    for part in reversed(path_parts):
        year_match = re.search(r'(\d{4}-(?:\d{4}|current))', part)
        if year_match:
            return year_match.group(1)
    return 'current'


def build_product_catalog(logos_dir):
    """
    Build a catalog of all products by reading every metadata.md under logos/.
    Returns a dict keyed by the metadata.md path with parsed metadata,
    and a list of product entries for the JS output.
    """
    products = []
    metadata_cache = {}  # metadata_path -> parsed metadata

    for md_path in sorted(logos_dir.rglob('metadata.md')):
        metadata = parse_metadata(md_path)
        metadata_cache[str(md_path)] = metadata

        # Determine the folder slug (relative to logos/)
        folder_rel = md_path.parent.relative_to(logos_dir)
        slug = str(folder_rel).replace('\\', '/')

        # Parse prodfamilies into a list
        families_raw = metadata.get('prodfamilies', '')
        families = [f.strip() for f in families_raw.split(',') if f.strip()] if families_raw else []

        products.append({
            'slug': slug,
            'name': metadata.get('name', '') or fallback_name_from_folder(slug.split('/')[-1]),
            'type': metadata.get('type', ''),
            'status': metadata.get('status', ''),
            'altnames': metadata.get('altnames', ''),
            'families': families
        })

    return products, metadata_cache


def scan_logos(logos_dir):
    """Scan logos/ directory for logo files, enriching each with metadata."""
    logos = []
    logo_id = 0

    # Pre-build metadata cache: for each metadata.md, cache the parsed result
    _, metadata_cache = build_product_catalog(logos_dir)
    # Build a lookup: folder path -> metadata
    folder_metadata = {}
    for md_path_str, metadata in metadata_cache.items():
        folder = str(Path(md_path_str).parent)
        folder_metadata[folder] = metadata

    for root, dirs, files in os.walk(logos_dir):
        root_path = Path(root)

        for file in sorted(files):
            if file in SKIP_FILES:
                continue

            file_path = root_path / file

            # Check if file has a logo extension
            if file_path.suffix.lower() not in LOGO_EXTENSIONS:
                continue

            # Find nearest metadata.md
            nearest_md = find_nearest_metadata(file_path, logos_dir)
            if nearest_md:
                metadata = folder_metadata.get(str(nearest_md.parent), {})
            else:
                metadata = {}

            # Relative path from repo root (logos/product/...)
            rel_path = file_path.relative_to(REPO_ROOT)
            rel_path_str = str(rel_path).replace('\\', '/')

            # Path parts relative to logos/ for style/year detection
            rel_to_logos = file_path.relative_to(logos_dir)
            path_parts = rel_to_logos.parts

            # Product name from metadata, or fallback from top-level folder name
            product_name = metadata.get('name', '')
            if not product_name:
                # Use the top-level folder under logos/ as fallback
                top_folder = path_parts[0] if path_parts else 'Other'
                product_name = fallback_name_from_folder(top_folder)

            # Product families
            families_raw = metadata.get('prodfamilies', '')
            families = [f.strip() for f in families_raw.split(',') if f.strip()] if families_raw else []
            # Use first family as primary, or 'Other' if none
            primary_family = families[0] if families else 'Other'

            # Type and status
            product_type = metadata.get('type', '')
            product_status = metadata.get('status', '')
            altnames = metadata.get('altnames', '')

            # Style from path
            style = determine_style(rel_path_str)

            # Year/era from folder structure
            year = determine_year(path_parts[:-1])  # exclude filename

            # Size from filename
            size = ''
            size_match = re.search(r'(\d+x\d+)', file)
            if size_match:
                size = size_match.group(1)

            # Format
            file_format = get_file_format(file)

            # Product folder slug (top-level folder under logos/)
            product_slug = path_parts[0] if path_parts else ''

            logos.append({
                'id': logo_id,
                'name': product_name,
                'family': primary_family,
                'families': families,
                'type': product_type,
                'status': product_status,
                'altnames': altnames,
                'productSlug': product_slug,
                'filename': file,
                'path': rel_path_str,
                'style': style,
                'year': year,
                'size': size,
                'format': file_format
            })
            logo_id += 1

    return logos

def get_recent_additions(repo_root, limit=50):
    """Get recently added logo files from git history (only files under logos/)"""
    recent_files = []

    try:
        cmd = [
            'git', 'log',
            '--all',
            '--pretty=format:%H|%ai|%an|%ae',
            '--name-status',
            '--diff-filter=A',
            '--', 'logos/'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, cwd=repo_root)

        if result.returncode != 0:
            print("Warning: Could not get git history for recent additions")
            return []

        lines = result.stdout.split('\n')
        current_commit = None

        for line in lines:
            line = line.strip()
            if '|' in line and len(line.split('|')) == 4:
                parts = line.split('|')
                current_commit = {
                    'sha': parts[0],
                    'date': parts[1],
                    'author': parts[2],
                    'email': parts[3]
                }
            elif line.startswith('A\t') and current_commit:
                file_path = line[2:].strip()
                path_obj = Path(file_path)

                if (path_obj.suffix.lower() in LOGO_EXTENSIONS and
                        file_path.startswith('logos/')):
                    full_path = repo_root / file_path
                    if full_path.exists():
                        recent_files.append({
                            'path': file_path,
                            'date': current_commit['date'],
                            'author': current_commit['author'],
                            'sha': current_commit['sha']
                        })

        recent_files.sort(key=lambda x: x['date'], reverse=True)

    except Exception as e:
        print(f"Warning: Error getting git history: {e}")
        return []

    return recent_files[:limit]

def make_github_api_request(url):
    """Make a GitHub API request, using GITHUB_TOKEN if available"""
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'MicrosoftCloudLogos-Generator/1.0')
    req.add_header('Accept', 'application/vnd.github+json')
    github_token = os.environ.get('GITHUB_TOKEN', '')
    if github_token:
        req.add_header('Authorization', f'Bearer {github_token}')
    return req


def get_github_display_name(login):
    """Fetch display name from GitHub user profile, falling back to login"""
    try:
        req = make_github_api_request(f'https://api.github.com/users/{login}')
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            display_name = data.get('name') or ''
            return display_name.strip() if display_name.strip() else login
    except Exception as e:
        print(f"Warning: Could not fetch display name for {login}: {e}")
        return login


def get_contributors(repo_root):
    """Get list of contributors from GitHub API"""
    contributors_list = []
    
    try:
        # Try to detect repository owner/name from git remote
        cmd = ['git', 'config', '--get', 'remote.origin.url']
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=repo_root)
        
        if result.returncode != 0:
            print("Warning: Could not get git remote URL")
            return []
        
        # Parse GitHub repo from remote URL
        # Formats: https://github.com/owner/repo.git or git@github.com:owner/repo.git
        remote_url = result.stdout.strip()
        match = re.search(r'github\.com[:/]([^/]+)/([^/\s]+?)(?:\.git)?$', remote_url)
        
        if not match:
            print("Warning: Could not parse GitHub repository from remote URL")
            return []
        
        owner = match.group(1)
        repo = match.group(2)
        
        # Fetch contributors from GitHub API
        api_url = f'https://api.github.com/repos/{owner}/{repo}/contributors'
        
        req = make_github_api_request(api_url)
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            for contributor in data:
                # Skip bot accounts based on type field
                contrib_type = contributor.get('type', '')
                
                if contrib_type == 'Bot':
                    continue
                
                login = contributor.get('login', '')
                
                # Skip accounts with [bot] suffix in the login
                if '[bot]' in login:
                    continue
                
                # Fetch display name from user profile
                display_name = get_github_display_name(login)
                
                contributors_list.append({
                    'name': display_name,
                    'github_username': login,
                    'contributions': contributor.get('contributions', 0)
                })
        
        print(f"Fetched {len(contributors_list)} contributors from GitHub API")
        
    except urllib.error.URLError as e:
        print(f"Warning: Could not fetch contributors from GitHub API: {e}")
        print("Falling back to git log method...")
        # Fall back to git log if API call fails
        return get_contributors_from_git(repo_root)
    except Exception as e:
        print(f"Warning: Error getting contributors: {e}")
        print("Falling back to git log method...")
        return get_contributors_from_git(repo_root)
    
    return contributors_list


def get_contributors_from_git(repo_root):
    """Fallback method: Get list of contributors from git history"""
    contributors_by_username = {}  # GitHub username -> contributor info
    contributors_by_name = {}      # Name (lowercase) -> contributor info
    names_with_github_username = set()  # Track names that have GitHub usernames
    
    try:
        # Get all contributors
        cmd = ['git', 'log', '--all', '--pretty=format:%an|%ae']
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=repo_root)
        
        if result.returncode != 0:
            print("Warning: Could not get git history for contributors")
            return []
        
        lines = result.stdout.split('\n')
        for line in lines:
            line = line.strip()
            if '|' in line:
                parts = line.split('|')
                name = parts[0]
                email = parts[1]
                
                # Skip bot accounts
                if 'bot' in email.lower() or 'bot' in name.lower():
                    continue
                
                # Extract GitHub username from email if it's a GitHub noreply email
                github_username = None
                if 'users.noreply.github.com' in email:
                    # Format: username@users.noreply.github.com or id+username@users.noreply.github.com
                    email_parts = email.split('@')[0]
                    if '+' in email_parts:
                        github_username = email_parts.split('+')[1]
                    else:
                        github_username = email_parts
                
                # Deduplicate: prefer entries with GitHub usernames
                name_key = name.lower()
                
                if github_username:
                    # If we have a GitHub username, use it as the primary key
                    if github_username not in contributors_by_username:
                        contributors_by_username[github_username] = {
                            'name': name,
                            'github_username': github_username
                        }
                    # Mark this name as having a GitHub username
                    names_with_github_username.add(name_key)
                else:
                    # No GitHub username - only add if we haven't seen this name with a GitHub username
                    if name_key not in names_with_github_username and name_key not in contributors_by_name:
                        contributors_by_name[name_key] = {
                            'name': name,
                            'github_username': None
                        }
        
        # Combine results: GitHub username entries + name-only entries
        result = list(contributors_by_username.values())
        result.extend(contributors_by_name.values())
        
    except Exception as e:
        print(f"Warning: Error getting contributors: {e}")
        return []
    
    return result

def generate_logo_data_js(logos, product_catalog, recent_additions, contributors, output_file):
    """Generate logo-data.js file"""
    # Sort logos by name for consistency
    logos_sorted = sorted(logos, key=lambda x: (x['family'], x['name'], x['path']))

    # Generate JavaScript file
    js_content = "// Auto-generated logo data\n"
    js_content += "const logoData = "
    js_content += json.dumps(logos_sorted, indent=2)
    js_content += ";\n\n"

    # Add product catalog (metadata-based hierarchy)
    js_content += "// Product catalog from metadata.md files\n"
    js_content += "const productCatalog = "
    js_content += json.dumps(product_catalog, indent=2)
    js_content += ";\n\n"

    # Add recent additions
    js_content += "// Recently added files\n"
    js_content += "const recentAdditions = "
    js_content += json.dumps(recent_additions, indent=2)
    js_content += ";\n\n"

    # Add contributors
    js_content += "// Contributors\n"
    js_content += "const contributors = "
    js_content += json.dumps(contributors, indent=2)
    js_content += ";\n"

    # Write to file
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(js_content)

    return len(logos_sorted)

def main():
    """Main function"""
    print("Building product catalog from metadata.md files...")
    product_catalog, _ = build_product_catalog(LOGOS_DIR)
    print(f"Found {len(product_catalog)} products/features in catalog")

    print("Scanning logos/ directory for logo files...")
    logos = scan_logos(LOGOS_DIR)
    print(f"Found {len(logos)} logo files")

    print("Getting recent additions from git history...")
    recent_additions = get_recent_additions(REPO_ROOT, limit=50)
    print(f"Found {len(recent_additions)} recent additions")

    print("Getting contributors from git history...")
    contributors = get_contributors(REPO_ROOT)
    print(f"Found {len(contributors)} contributors")

    print(f"Generating {OUTPUT_FILE}...")
    count = generate_logo_data_js(logos, product_catalog, recent_additions, contributors, OUTPUT_FILE)

    print(f"✓ Generated logo-data.js with {count} logos")

    # Print summary by family
    families = {}
    for logo in logos:
        family = logo['family']
        families[family] = families.get(family, 0) + 1

    print("\nLogos by product family:")
    for family in sorted(families.keys()):
        print(f"  {family}: {families[family]}")


if __name__ == '__main__':
    main()
