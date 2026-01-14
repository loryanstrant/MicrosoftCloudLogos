#!/usr/bin/env python3
"""
Generate logo-data.js from repository structure
This script scans the repository for logo files and generates the logo-data.js
file used by the GitHub Pages interface.
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
DOCS_DIR = REPO_ROOT / "docs"
OUTPUT_FILE = DOCS_DIR / "js" / "logo-data.js"

# File extensions to include
LOGO_EXTENSIONS = {'.png', '.svg', '.jpg', '.jpeg', '.ico', '.pdf'}

# Folders to exclude from scanning
EXCLUDE_FOLDERS = {'docs', '.git', 'node_modules', '.github'}

def get_file_format(filename):
    """Extract file format from filename"""
    ext = Path(filename).suffix.upper()
    return ext[1:] if ext else ''

def parse_logo_path(path, repo_root):
    """Parse logo information from file path"""
    # Get relative path from repo root
    rel_path = path.relative_to(repo_root)
    parts = rel_path.parts
    
    # Skip if in excluded folders
    if any(excluded in parts for excluded in EXCLUDE_FOLDERS):
        return None
    
    # Determine product family (top-level folder)
    family = parts[0] if len(parts) > 0 else 'Other'
    
    # Get filename
    filename = parts[-1]
    
    # Extract product name from filename (remove extensions and numbers)
    name = Path(filename).stem
    # Clean up name: remove size specifications like _256x256, icon numbers like 02681-icon-service-
    name = re.sub(r'[-_]\d+x\d+$', '', name)  # Remove size specs
    name = re.sub(r'^\d+-icon-service-', '', name)  # Remove Azure icon prefixes
    name = re.sub(r'^[0-9\-]+', '', name)  # Remove leading numbers and dashes
    name = re.sub(r'[-_]scalable$', '', name, flags=re.IGNORECASE)  # Remove scalable suffix
    # Replace underscores and dashes with spaces
    name = name.replace('_', ' ').replace('-', ' ')
    # Clean up multiple spaces
    name = re.sub(r'\s+', ' ', name).strip()
    # Capitalize words appropriately
    name = ' '.join(word.capitalize() if word.lower() not in ['365', 'and', 'or', 'the', 'of', 'for'] else word for word in name.split())
    
    # Determine style based on folder/filename
    style = 'full-color'  # default
    path_str = str(rel_path).lower()
    if 'monochrome-negative' in path_str or 'monochromatic-negative' in path_str:
        style = 'monochrome-negative'
    elif 'monochrome-positive' in path_str or 'monochromatic-positive' in path_str:
        style = 'monochrome-positive'
    elif 'monochrome' in path_str or 'monochromatic' in path_str:
        style = 'monochrome'
    elif 'negative' in path_str:
        style = 'negative'
    elif 'positive' in path_str:
        style = 'positive'
    
    # Determine year/era based on folder structure
    year = 'current'  # default
    if 'zzLEGACY' in str(rel_path) or 'legacy' in path_str:
        year = 'legacy'
    else:
        # Check for year patterns in path (e.g., "2019-2023", "2020-2024")
        year_match = re.search(r'\b(19|20)\d{2}[-–]\d{4}\b', path_str)
        if year_match:
            year = 'legacy'
    
    # Get file size (could be extracted from filename or left empty)
    size = ''
    size_match = re.search(r'(\d+x\d+)', filename)
    if size_match:
        size = size_match.group(1)
    
    # Get format
    file_format = get_file_format(filename)
    
    return {
        'name': name,
        'family': family,
        'filename': filename,
        'path': str(rel_path).replace('\\', '/'),  # Use forward slashes for web
        'style': style,
        'year': year,
        'size': size,
        'format': file_format
    }

def scan_logos(root_path):
    """Scan repository for logo files"""
    logos = []
    logo_id = 0
    
    for root, dirs, files in os.walk(root_path):
        # Remove excluded directories from dirs list to prevent walking into them
        dirs[:] = [d for d in dirs if d not in EXCLUDE_FOLDERS]
        
        root_path_obj = Path(root)
        
        for file in files:
            file_path = root_path_obj / file
            
            # Check if file has a logo extension
            if file_path.suffix.lower() in LOGO_EXTENSIONS:
                logo_info = parse_logo_path(file_path, root_path)
                
                if logo_info:
                    logo_info['id'] = logo_id
                    logos.append(logo_info)
                    logo_id += 1
    
    return logos

def get_recent_additions(repo_root, limit=50):
    """Get recently added logo files from git history"""
    recent_files = []
    
    try:
        # Get list of added files from git history (not renames or moves, just additions)
        # Using --diff-filter=A to get only added files
        # Increase buffer since many commits don't contain logo files - we need 5x to ensure adequate coverage after filtering
        cmd = [
            'git', 'log', 
            '--all',
            '--pretty=format:%H|%ai|%an|%ae',
            '--name-status',
            '--diff-filter=A',
            # Request enough commits to find plenty of logo additions
            # We multiply by 5 to have a buffer since not all commits contain logo additions
            f'-{limit * 5}'
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
                # This is a commit info line
                parts = line.split('|')
                current_commit = {
                    'sha': parts[0],
                    'date': parts[1],
                    'author': parts[2],
                    'email': parts[3]
                }
            elif line.startswith('A\t') and current_commit:
                # This is an added file
                file_path = line[2:].strip()
                
                # Check if it's a logo file and not in excluded folders
                path_obj = Path(file_path)
                if (path_obj.suffix.lower() in LOGO_EXTENSIONS and
                    not any(excluded in path_obj.parts for excluded in EXCLUDE_FOLDERS)):
                    
                    # Check if file still exists before adding to the list
                    full_path = repo_root / file_path
                    if full_path.exists():
                        recent_files.append({
                            'path': file_path,
                            'date': current_commit['date'],
                            'author': current_commit['author'],
                            'sha': current_commit['sha']
                        })
        
        # Sort collected files by date (most recent first) to show truly recent additions
        # rather than files ordered by git log traversal (which can be alphabetical within commits)
        recent_files.sort(key=lambda x: x['date'], reverse=True)
        
    except Exception as e:
        print(f"Warning: Error getting git history: {e}")
        return []
    
    return recent_files[:limit]

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
        
        # Add User-Agent header as required by GitHub API
        req = urllib.request.Request(api_url)
        req.add_header('User-Agent', 'MicrosoftCloudLogos-Generator/1.0')
        
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
                
                contributors_list.append({
                    'name': login,  # Use login as display name
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

def generate_logo_data_js(logos, recent_additions, contributors, output_file):
    """Generate logo-data.js file"""
    # Sort logos by name for consistency
    logos_sorted = sorted(logos, key=lambda x: (x['family'], x['name'], x['path']))
    
    # Generate JavaScript file
    js_content = "// Auto-generated logo data\n"
    js_content += "const logoData = "
    js_content += json.dumps(logos_sorted, indent=2)
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
    print("Scanning repository for logo files...")
    logos = scan_logos(REPO_ROOT)
    
    print(f"Found {len(logos)} logo files")
    
    print("Getting recent additions from git history...")
    recent_additions = get_recent_additions(REPO_ROOT, limit=50)
    print(f"Found {len(recent_additions)} recent additions")
    
    print("Getting contributors from git history...")
    contributors = get_contributors(REPO_ROOT)
    print(f"Found {len(contributors)} contributors")
    
    print(f"Generating {OUTPUT_FILE}...")
    count = generate_logo_data_js(logos, recent_additions, contributors, OUTPUT_FILE)
    
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
