

def extract_all_markets_and_odds(ev_fi):
    """Estrai tutti i mercati e quote per un evento"""
    markets = []
    odds = []
    
    for key, obj in DATA.items():
        if not isinstance(obj, dict):
            continue
            
        # Se e un mercato per questo evento
        if obj.get("FI") == ev_fi and "MA" in key:
            markets.append({
                "market_id": obj.get("ID"),
                "market_name": obj.get("NA"),
                "order": obj.get("OR", 0)
            })
        
        # Se e una quota per questo evento
        if obj.get("FI") == ev_fi and obj.get("OD"):
            try:
                raw_frac = obj.get("OD")
                num, den = raw_frac.split("/")
                decimal_odd = round(float(num) / float(den) + 1, 3)
            except:
                decimal_odd = None
                
            odds.append({
                "participant_id": obj.get("ID"),
                "participant_name": obj.get("NA"),
                "market_id": obj.get("MA"),
                "odds_fractional": obj.get("OD"),
                "odds_decimal": decimal_odd,
                "order": obj.get("OR", 0),
                "handicap": obj.get("HA"),
                "status": obj.get("SU", 0)
            })
    
    return markets, odds

@app.route("/live/detailed", methods=["GET"])
def live_detailed():
    """Endpoint per verificare aggiornamenti in tempo reale con tutte le quote"""
    sport = request.args.get("sport", "1")
    
    events_data = []
    
    if sport == "1":
        events = soccer_data()
    elif sport == "18":
        events = basketball_data()
    elif sport == "13":
        events = tennis_data()
    else:
        events = []
    
    for event in events:
        markets, odds = extract_all_markets_and_odds(event["fi"])
        
        events_data.append({
            "event": event["event"],
            "fi": event["fi"],
            "web_page_id": event["web_page_id"],
            "league": event["league"],
            "time": event["time"],
            "score": event["score"],
            "period": event.get("period", ""),
            "total_markets": len(markets),
            "total_odds": len(odds),
            "markets": markets[:10],  # Prime 10 per non sovraccaricare
            "odds": odds[:20],        # Prime 20 per non sovraccaricare
            "last_update": datetime.now().isoformat()
        })
    
    return jsonify({
        "sport": sport,
        "timestamp": datetime.now().isoformat(),
        "total_events": len(events_data),
        "events": events_data
    }), 200

@app.route("/status", methods=["GET"])
def get_status():
    """Status generale del sistema"""
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "total_data_keys": len(DATA),
        "soccer_events": len(soccer_data()),
        "basketball_events": len(basketball_data()),
        "tennis_events": len(tennis_data()),
        "language": language,
        "suffix": SUFFIX
    }), 200

