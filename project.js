const api = {
  trending: () => fetch('/api/trending').then(r => {
    if (!r.ok) throw new Error('Network error');
    return r.json();
  }),
  search: (params) => {
    const qs = new URLSearchParams(params);
    return fetch('/api/search?' + qs.toString()).then(r => {
      if (!r.ok) throw new Error('Network error');
      return r.json();
    });
  },
  rate: (payload) => fetch('/api/rate', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(payload) 
  }).then(r => {
    if (!r.ok) throw new Error('Network error');
    return r.json();
  })
};

function $(sel){ return document.querySelector(sel); }
function el(tag, cls){ const e=document.createElement(tag); if(cls) e.className=cls; return e; }

async function loadTrending(){
  const container = $('#trending');
  if (!container) return;
  
  container.innerHTML = 'Loading...';
  try{
    const { trending } = await api.trending();
    container.innerHTML = '';
    (trending||[]).forEach(t => {
      const chip = el('div','chip');
      chip.textContent = t.dishName;
      chip.addEventListener('click', () => {
        const queryEl = $('#query');
        if (queryEl) {
          queryEl.value = t.dishName;
          doSearch();
        }
      });
      container.appendChild(chip);
    });
    if(!trending || trending.length===0){
      container.textContent = 'No trending dishes yet. Be the first to rate!';
    }
  }catch(e){
    container.textContent = 'Failed to load trending.';
    console.error('Trending error:', e);
  }
}

function getParams(){
  const queryEl = $('#query');
  const pincodeEl = $('#pincode');
  const vegEl = $('#veg');
  const nonVegEl = $('#nonVeg');
  const spicyEl = $('#spicy');
  const maxPriceEl = $('#maxPrice');
  
  const q = queryEl ? queryEl.value.trim() : '';
  const pincode = pincodeEl ? pincodeEl.value.trim() : '';
  const veg = vegEl && vegEl.checked ? 'true' : undefined;
  const nonVeg = nonVegEl && nonVegEl.checked ? 'true' : undefined;
  const spicy = spicyEl && spicyEl.checked ? 'true' : undefined;
  const maxPriceVal = maxPriceEl ? maxPriceEl.value : '';
  const maxPrice = maxPriceVal ? String(Number(maxPriceVal)) : undefined;
  
  // Only include pincode if it's valid (6 digits)
  const validPincode = pincode && /^\d{6}$/.test(pincode) ? pincode : undefined;
  
  return { q, pincode: validPincode, veg, nonVeg, spicy, maxPrice };
}

async function doSearch(){
  const params = getParams();
  const resultsEl = $('#results');
  const pincodeEl = $('#pincode');
  
  if (!resultsEl) return;
  
  const pincode = pincodeEl ? pincodeEl.value.trim() : '';
  
  // Show search context
  let searchContext = '';
  if (params.pincode) {
    searchContext = ` in PIN ${params.pincode}`;
  } else if (pincode && !params.pincode) {
    searchContext = ' (Invalid PIN - showing all areas)';
  } else {
    searchContext = ' (All areas)';
  }
  
  resultsEl.innerHTML = `Searching${searchContext}...`;
  
  try{
    const { results } = await api.search(params);
    renderResults(results || [], searchContext);
  }catch(e){
    resultsEl.textContent = 'Search failed. Please try again.';
    console.error('Search error:', e);
  }
}

function renderResults(items, searchContext = ''){
  const resultsEl = $('#results');
  if (!resultsEl) return;
  
  resultsEl.innerHTML = '';
  
  if(items.length===0){ 
    resultsEl.innerHTML = `<p>No results found${searchContext}.</p><p>Try searching for: biryani, pizza, dosa, burger, or check different filters.</p>`;
    return; 
  }
  
  // Show results header with context
  const header = document.createElement('h3');
  header.textContent = `Found ${items.length} dish${items.length !== 1 ? 'es' : ''}${searchContext}`;
  resultsEl.appendChild(header);
  
  const tpl = document.getElementById('cardTpl');
  if (!tpl) {
    resultsEl.innerHTML = '<p>Template not found. Please refresh the page.</p>';
    return;
  }
  
  items.slice(0, 20).forEach(it => {
    const node = tpl.content.cloneNode(true);
    const dishNameEl = node.querySelector('.dish-name');
    const ratingEl = node.querySelector('.rating');
    const restaurantNameEl = node.querySelector('.restaurant-name');
    const metaEl = node.querySelector('.meta');
    const rateInput = node.querySelector('.rate-input');
    const reviewInput = node.querySelector('.review-input');
    const rateBtn = node.querySelector('.rate-btn');
    
    if (dishNameEl) dishNameEl.textContent = it.dishName;
    if (ratingEl) ratingEl.textContent = `${it.averageRating}★ (${it.ratingCount})`;
    if (restaurantNameEl) restaurantNameEl.textContent = it.restaurantName;
    if (metaEl) metaEl.textContent = `${it.veg? 'Veg' : 'Non-veg'} • ${it.spicy? 'Spicy' : 'Mild'} • ₹${it.price}`;
    
    if (rateBtn) {
      rateBtn.addEventListener('click', async () => {
        const stars = Number(rateInput ? rateInput.value : 0);
        if(!stars || stars < 1 || stars > 5){
          alert('Please rate between 1 and 5');
          return;
        }
        try {
          await api.rate({ 
            restaurantId: it.restaurantId, 
            dishId: it.dishId, 
            stars, 
            review: reviewInput ? reviewInput.value : '' 
          });
          alert('Thanks for your rating!');
          doSearch();
          loadTrending();
        } catch (e) {
          alert('Failed to submit rating. Please try again.');
          console.error('Rating error:', e);
        }
      });
    }
    resultsEl.appendChild(node);
  });
}

// Initialize event listeners when DOM is ready
function initializeEventListeners() {
  const searchBtn = document.getElementById('searchBtn');
  const queryEl = document.getElementById('query');
  const pincodeEl = document.getElementById('pincode');
  const useLocationBtn = document.getElementById('useLocation');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', doSearch);
  }
  
  if (queryEl) {
    queryEl.addEventListener('keydown', (e) => { 
      if(e.key === 'Enter'){ 
        doSearch(); 
      } 
    });
  }
  
  if (pincodeEl) {
    // PIN code input validation
    pincodeEl.addEventListener('input', (e) => {
      // Only allow numbers
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      
      // Update status
      const statusEl = document.getElementById('locationStatus');
      const pincode = e.target.value;
      
      if (statusEl) {
        if (pincode.length === 6) {
          statusEl.textContent = `PIN ${pincode} set. Ready to search!`;
          statusEl.style.color = '#22c55e';
        } else if (pincode.length > 0) {
          statusEl.textContent = `Enter ${6 - pincode.length} more digits`;
          statusEl.style.color = '#fbbf24';
        } else {
          statusEl.textContent = 'Enter your PIN code or click "Use My Location" to find nearby restaurants';
          statusEl.style.color = '';
        }
      }
    });
  }
  
  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', handleLocationClick);
  }
}

async function handleLocationClick() {
  const statusEl = document.getElementById('locationStatus');
  const pincodeInput = document.getElementById('pincode');
  
  if (!statusEl || !pincodeInput) return;
  
  statusEl.textContent = 'Detecting location...';
  
  if(!navigator.geolocation){ 
    statusEl.textContent = 'Geolocation not supported. Please enter PIN code manually.';
    return; 
  }
  
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    
    // Major Indian cities PIN code mapping
    let pincode;
    if (lat >= 12.9 && lat <= 13.1 && lng >= 77.5 && lng <= 77.7) {
      // Bangalore
      pincode = '560001';
    } else if (lat >= 19.0 && lat <= 19.3 && lng >= 72.8 && lng <= 73.0) {
      // Mumbai
      pincode = '400001';
    } else if (lat >= 28.5 && lat <= 28.8 && lng >= 77.0 && lng <= 77.3) {
      // Delhi
      pincode = '110001';
    } else if (lat >= 13.0 && lat <= 13.2 && lng >= 80.2 && lng <= 80.4) {
      // Chennai
      pincode = '600001';
    } else if (lat >= 22.5 && lat <= 22.7 && lng >= 88.3 && lng <= 88.5) {
      // Kolkata
      pincode = '700001';
    } else if (lat >= 17.3 && lat <= 17.5 && lng >= 78.4 && lng <= 78.6) {
      // Hyderabad
      pincode = '500001';
    } else if (lat >= 26.8 && lat <= 27.0 && lng >= 75.8 && lng <= 76.0) {
      // Jaipur
      pincode = '302001';
    } else if (lat >= 18.5 && lat <= 18.7 && lng >= 73.8 && lng <= 74.0) {
      // Pune
      pincode = '411001';
    } else if (lat >= 12.3 && lat <= 12.5 && lng >= 76.6 && lng <= 76.8) {
      // Mysore
      pincode = '570001';
    } else if (lat >= 19.8 && lat <= 20.0 && lng >= 85.8 && lng <= 86.0) {
      // Bhubaneswar
      pincode = '751001';
    } else if (lat >= 23.0 && lat <= 23.2 && lng >= 72.5 && lng <= 72.7) {
      // Ahmedabad
      pincode = '380001';
    } else if (lat >= 30.7 && lat <= 30.9 && lng >= 76.7 && lng <= 76.9) {
      // Chandigarh
      pincode = '160001';
    } else if (lat >= 25.3 && lat <= 25.5 && lng >= 82.9 && lng <= 83.1) {
      // Varanasi
      pincode = '221001';
    } else if (lat >= 26.2 && lat <= 26.4 && lng >= 78.1 && lng <= 78.3) {
      // Agra
      pincode = '282001';
    } else if (lat >= 15.3 && lat <= 15.5 && lng >= 73.9 && lng <= 74.1) {
      // Goa
      pincode = '403001';
    } else if (lat >= 31.1 && lat <= 31.3 && lng >= 75.5 && lng <= 75.7) {
      // Amritsar
      pincode = '143001';
    } else if (lat >= 24.5 && lat <= 24.7 && lng >= 73.7 && lng <= 73.9) {
      // Udaipur
      pincode = '313001';
    } else if (lat >= 21.1 && lat <= 21.3 && lng >= 79.0 && lng <= 79.2) {
      // Nagpur
      pincode = '440001';
    } else if (lat >= 20.2 && lat <= 20.4 && lng >= 85.8 && lng <= 86.0) {
      // Cuttack
      pincode = '753001';
    } else if (lat >= 11.0 && lat <= 11.2 && lng >= 76.9 && lng <= 77.1) {
      // Coimbatore
      pincode = '641001';
    } else if (lat >= 8.4 && lat <= 8.6 && lng >= 77.0 && lng <= 77.2) {
      // Thiruvananthapuram
      pincode = '695001';
    } else if (lat >= 9.9 && lat <= 10.1 && lng >= 76.2 && lng <= 76.4) {
      // Kochi
      pincode = '682001';
    } else if (lat >= 10.7 && lat <= 10.9 && lng >= 78.8 && lng <= 79.0) {
      // Madurai
      pincode = '625001';
    } else if (lat >= 16.3 && lat <= 16.5 && lng >= 80.4 && lng <= 80.6) {
      // Vijayawada
      pincode = '520001';
    } else if (lat >= 15.8 && lat <= 16.0 && lng >= 74.5 && lng <= 74.7) {
      // Belgaum
      pincode = '590001';
    } else if (lat >= 25.6 && lat <= 25.8 && lng >= 85.1 && lng <= 85.3) {
      // Patna
      pincode = '800001';
    } else if (lat >= 22.3 && lat <= 22.5 && lng >= 70.7 && lng <= 70.9) {
      // Rajkot
      pincode = '360001';
    } else if (lat >= 23.1 && lat <= 23.3 && lng >= 75.7 && lng <= 75.9) {
      // Indore
      pincode = '452001';
    } else if (lat >= 24.8 && lat <= 25.0 && lng >= 93.9 && lng <= 94.1) {
      // Imphal
      pincode = '795001';
    } else if (lat >= 25.6 && lat <= 25.8 && lng >= 91.8 && lng <= 92.0) {
      // Shillong
      pincode = '793001';
    } else if (lat >= 26.1 && lat <= 26.3 && lng >= 91.7 && lng <= 91.9) {
      // Guwahati
      pincode = '781001';
    } else if (lat >= 27.4 && lat <= 27.6 && lng >= 94.7 && lng <= 94.9) {
      // Itanagar
      pincode = '791111';
    } else if (lat >= 23.7 && lat <= 23.9 && lng >= 92.7 && lng <= 92.9) {
      // Aizawl
      pincode = '796001';
    } else if (lat >= 25.9 && lat <= 26.1 && lng >= 94.1 && lng <= 94.3) {
      // Kohima
      pincode = '797001';
    } else if (lat >= 24.8 && lat <= 25.0 && lng >= 93.9 && lng <= 94.1) {
      // Agartala
      pincode = '799001';
    } else {
      // Default fallback - Bangalore
      pincode = '560001';
    }
    
    pincodeInput.value = pincode;
    statusEl.textContent = `Location detected! Using PIN ${pincode}`;
    statusEl.style.color = '#22c55e';
    
    // Auto-search if there's a query
    const queryEl = $('#query');
    if (queryEl && queryEl.value.trim()) {
      doSearch();
    }
  }, (err) => {
    let errorMsg = 'Location access denied. ';
    switch(err.code) {
      case err.PERMISSION_DENIED:
        errorMsg += 'Please allow location access or enter PIN manually.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMsg += 'Location unavailable. Please enter PIN manually.';
        break;
      case err.TIMEOUT:
        errorMsg += 'Location request timed out. Please enter PIN manually.';
        break;
      default:
        errorMsg += 'Please enter PIN code manually.';
    }
    statusEl.textContent = errorMsg;
    statusEl.style.color = '#ef4444';
  }, {
    timeout: 10000,
    enableHighAccuracy: false
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadTrending();
});



