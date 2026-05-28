#!/bin/bash
RESULTS_FILE="/home/z/my-project/download/image_results.json"

# Initialize results if not exists
if [ ! -f "$RESULTS_FILE" ]; then
    echo '{}' > "$RESULTS_FILE"
fi

TOTAL=$(wc -l < /home/z/my-project/download/product_urls.txt)
COUNT=0

while IFS='|' read -r pid url; do
    COUNT=$((COUNT + 1))
    
    # Check if already fetched
    if python3 -c "import json; d=json.load(open('$RESULTS_FILE')); exit(0 if '$pid' in d else 1)" 2>/dev/null; then
        echo "[$COUNT/$TOTAL] SKIP $pid (already done)"
        continue
    fi
    
    echo -n "[$COUNT/$TOTAL] FETCH $pid... "
    
    # Fetch page
    z-ai function -n page_reader -a "{\"url\": \"$url\"}" -o /tmp/wm_product.json 2>/dev/null
    
    # Extract first /asr/ image
    IMG=$(python3 -c "
import json, re
try:
    with open('/tmp/wm_product.json') as f:
        data = json.load(f)
    html = data.get('data', {}).get('html', '').replace('&amp;', '&')
    imgs = re.findall(r'(https://i5\.walmartimages\.com/asr/[^\"]+?\.jpeg)', html)
    seen = set()
    for i in imgs:
        c = i.split('?')[0]
        if c not in seen:
            seen.add(c)
            url_final = i
            if '?' not in url_final:
                url_final += '?odnHeight=450&odnWidth=450&odnBg=FFFFFF'
            print(url_final)
            break
except:
    pass
" 2>/dev/null)
    
    if [ -n "$IMG" ]; then
        echo "OK (${IMG:0:60}...)"
        # Add to results
        python3 -c "
import json
d = json.load(open('$RESULTS_FILE'))
d['$pid'] = '$IMG'
with open('$RESULTS_FILE', 'w') as f:
    json.dump(d, f, indent=2)
" 2>/dev/null
    else
        echo "FAILED"
    fi
    
    # Small delay
    sleep 1
done < /home/z/my-project/download/product_urls.txt

echo ""
echo "=== DONE ==="
python3 -c "
import json
d = json.load(open('$RESULTS_FILE'))
print(f'Total fetched: {len(d)}')
"
