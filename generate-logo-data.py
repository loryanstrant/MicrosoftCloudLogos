#!/usr/bin/env python3
"""
Generate logo-data.js from repository structure
This script scans the repository for logo files and generates the logo-data.js
file used by the GitHub Pages interface.
"""

import os
import json
import re
from pathlib import Path

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

def generate_logo_data_js(logos, output_file):
    """Generate logo-data.js file"""
    # Sort logos by name for consistency
    logos_sorted = sorted(logos, key=lambda x: (x['family'], x['name'], x['path']))
    
    # Generate JavaScript file
    js_content = "// Auto-generated logo data\n"
    js_content += "const logoData = "
    js_content += json.dumps(logos_sorted, indent=2)
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
    
    print(f"Generating {OUTPUT_FILE}...")
    count = generate_logo_data_js(logos, OUTPUT_FILE)
    
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
