import json
import subprocess
import re
import sys
import os
import time

# Load products needing images
with open('/home/z/my-project/download/products_needing_images.json') as f:
    products = json.load(f)

results_file = '/home/z/my-project/download/image_results.json'
# Load existing results if any
if os.path.exists(results_file):
    with open(results_file) as f:
        results = json.load(f)
else:
    results = {}

print(f"Total products: {len(products)}")
print(f"Already fetched: {len(results)}")
remaining = [p for p in products if p['id'] not in results]
print(f"Remaining: {len(remaining)}")

def fetch_product_image(product):
    pid = product['id']
    url = product['walmartUrl']
    
    try:
        result = subprocess.run(
            ['z-ai', 'function', '-n', 'page_reader', '-a', json.dumps({"url": url})],
            capture_output=True, text=True, timeout=30
        )
        
        # Parse the output - z-ai outputs the result to stdout
        output = result.stdout + result.stderr
        
        # Try to find JSON in output
        # Sometimes z-ai saves to a temp file, let's try to extract from output
        # Look for the result data
        json_match = re.search(r'\{[^{}]*"data"[^{}]*"html"[^{}]*\}', output, re.DOTALL)
        
        if not json_match:
            # Try reading from the last line which might be a JSON path
            return None, "No HTML content found"
        
        # Extract the full output and look for HTML content
        html = ""
        
        # The z-ai CLI might output the result inline
        # Look for image URLs in the entire output
        asr_imgs = re.findall(r'(https://i5\.walmartimages\.com/asr/[^"\'\s\\,\}]+\.jpeg)', output)
        
        if asr_imgs:
            # Deduplicate and take first
            seen = set()
            unique = []
            for img in asr_imgs:
                clean = img.split('?')[0]
                if clean not in seen:
                    seen.add(clean)
                    unique.append(img)
            
            if unique:
                # Add sizing params
                main_img = unique[0].split('\\')[0]  # Clean any escape chars
                if '?' not in main_img:
                    main_img += '?odnHeight=450&odnWidth=450&odnBg=FFFFFF'
                return main_img, None
        
        return None, "No /asr/ images found in output"
    
    except subprocess.TimeoutExpired:
        return None, "Timeout"
    except Exception as e:
        return None, str(e)

# Process in batches
batch_size = 3
failed = []
for i in range(0, len(remaining), batch_size):
    batch = remaining[i:i+batch_size]
    batch_num = i // batch_size + 1
    total_batches = (len(remaining) + batch_size - 1) // batch_size
    
    print(f"\n--- Batch {batch_num}/{total_batches} ---")
    
    for product in batch:
        pid = product['id']
        print(f"  Fetching {pid}...", end=" ", flush=True)
        
        img_url, error = fetch_product_image(product)
        
        if img_url:
            results[pid] = img_url
            print(f"OK ({img_url[:60]}...)")
        else:
            failed.append(product)
            print(f"FAILED ({error})")
    
    # Save progress after each batch
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"  Progress: {len(results)}/{len(products)}")
    
    # Small delay between batches
    if i + batch_size < len(remaining):
        time.sleep(2)

print(f"\n=== DONE ===")
print(f"Success: {len(results)}")
print(f"Failed: {len(failed)}")
if failed:
    print("Failed products:")
    for p in failed:
        print(f"  - {p['id']}: {p['walmartUrl']}")
    with open('/home/z/my-project/download/failed_products.json', 'w') as f:
        json.dump(failed, f, indent=2)
