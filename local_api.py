import time
from datetime import datetime, timedelta
import pytz
import json
from flask_cors import CORS
from flask import Flask, request, jsonify
import os
import re

app = Flask(__name__)

##LOG_DIR = 'event_logs'
#os.makedirs(LOG_DIR, exist_ok=True)

rencols = {
    "3P": "PLACE_365",
    "3W": "WIN_365",
    "4Q": "MARKET_GROUP_PAIR_ID",
    "AB": "FINANCIALS_PRICE_1",
    "AC": "STATS_COLUMN",
    "AD": "ADDITIONAL_DATA",
    "AE": "STATS_CELL",
    "AF": "ARCHIVE_FIXTURE_INFO",
    "AH": "ASIAN_HOVER",
    "AI": "ANIMATION_ID",
    "AJ": "FINANCIALS_MARKET_ODDS_2",
    "AM": "ANIMATION_ICON",
    "AO": "ANIMATION_TOPIC",
    "AP": "STATS_PANE",
    "AQ": "FINANCIALS_CLOSE_TIME",
    "AS": "ADDITIONAL_STATS",
    "AT": "ANIMATION_TEXT",
    "AU": "AUDIO_AVAILABLE",
    "AV": "ARCHIVE_VIDEO_AVAILABLE",
    "BB": "BUTTON_BAR",
    "BC": "BOOK_CLOSES",
    "BD": "PULL_BET_DATA",
    "BE": "BET",
    "BH": "BLURB_HEADER",
    "BI": "BUTTON_BAR_INDEX",
    "BL": "BASE_LINE",
    "BO": "BASE_ODDS",
    "BS": "BANNER_STYLE",
    "BT": "INFO_POD_DETAIL_2",
    "C1": "C1_ID",
    "C2": "C2_ID",
    "C3": "MINI_DIARY_C3",
    "CB": "CLOSE_BETS_DISABLED",
    "CC": "BET_TYPE_PULL",
    "CD": "COMPETITION_DROPDOWN",
    "CF": "CONFIG",
    "CG": "GLOBAL_CONFIG",
    "CI": "CLASS_ID",
    "CK": "COMPETITION_KEY",
    "CL": "CLASSIFICATION",
    "CM": "BET_CALL_FEATURE_DISABLED",
    "CN": "CHANNEL",
    "CO": "COLUMN",
    "CP": "CLOSE_BETS_PRESENTATION_PULL_DISABLED",
    "CR": "CLASS_ORDER",
    "CS": "CLASSIFICATIONS",
    "CT": "COMPETITION_NAME",
    "CU": "CURRENT_INFO",
    "D1": "DATA_1",
    "D2": "DATA_2",
    "D3": "DATA_3",
    "D4": "DATA_4",
    "D5": "DATA_5",
    "DA": "DIARY_DAY",
    "DC": "DISPLAY_CLOCK",
    "DD": "DISPLAY_DATE",
    "DE": "DESCRIPTION",
    "DM": "IN_PLAY_LAUNCHER_DISPLAY_MODE",
    "DN": "DIARY_NAME",
    "DO": "DEFAULT_OPEN",
    "DP": "DECIMAL_PLACES",
    "DR": "DIARY_REFRESH",
    "DS": "DISPLAY_SCORE",
    "DX": "DISABLE_COLUMN_DISTRIBUTION",
    "DY": "DIARY",
    "EA": "EVENT_TIME",
    "EC": "ERROR_CODE",
    "ED": "EXTRA_DATA_2",
    "EE": "ETOTE_LINK_DATA",
    "EI": "EVENT_ID",
    "EL": "EXTRA_STATS_AVAILABLE",
    "EM": "EMPTY",
    "EP": "EXTRA_PARTICIPANTS",
    "ER": "ERROR_LOGGING",
    "ES": "EMBEDDED_STREAMING",
    "ET": "END_TIME",
    "EV": "EVENT",
    "EW": "EACH_WAY",
    "EX": "EXTRA_DATA_1",
    "FD": "FORCE_DISPLAY",
    "FF": "FILTERING",
    "FI": "FIXTURE_PARENT_ID",
    "FK": "FINANCIALS_FEED_1",
    "FL": "FINANCIALS_PERIOD_1",
    "FM": "FINANCIALS_MARKET_1A",
    "FN": "FINANCIALS_MARKET_1B",
    "FO": "FINANCIALS_FEED_2",
    "FP": "FINANCIALS_PERIOD_2",
    "FQ": "FINANCIALS_MARKET_2A",
    "FR": "FINANCIALS_MARKET_2B",
    "FS": "FIXTURE_STARTED",
    "FW": "FIXED_WIN",
    "GC": "LOTTO_GAME_CODE",
    "GM": "LOTTO_GAME_MARKET",
    "GR": "GROUP",
    "HA": "HANDICAP",
    "HD": "HANDICAP_FORMATTED",
    "HI": "HEADER_IMAGE",
    "HM": "MARKET_BAR",
    "HO": "DEFAULT_OPEN_HOMEPAGE",
    "HP": "SHOW_ON_HOMEPAGE",
    "HS": "HASH",
    "HT": "POD_HEADER_TEXT",
    "HU": "INFO_BANNER_SUBHEAD2",
    "HV": "POD_BODY_TEXT_2",
    "HW": "HORSE_WEIGHT",
    "HY": "HORSE_AGE",
    "I2": "ID2",
    "IA": "AUDIO_ICON",
    "IB": "IBOX",
    "IC": "ICON",
    "ID": "ID",
    "IF": "IN_PLAY",
    "IG": "IMAGE_ID",
    "IM": "IMAGE",
    "IN": "INFO",
    "IO": "ITEM_ORDER",
    "IP": "IN_PLAY_AVAILABLE_FLAG",
    "IQ": "INFO_POD_IMAGE1",
    "IR": "INRUNNING_INFO",
    "IS": "INFO_POD_IMAGE_PATH1",
    "IT": "TOPIC_ID",
    "ITX": "TOPIC_IDX",
    "IU": "INFO_POD_IMAGE2",
    "JN": "JOCKEY_PULL",
    "JY": "JOCKEY",
    "KC": "KIT_COLORS",
    "KI": "KIT_ID",
    "L1": "BREADCRUMB_LEVEL_1",
    "LA": "LABEL",
    "LB": "INFO_POD_LINK_1_DISPLAY_TEXT",
    "LC": "EVENT_COUNT",
    "LD": "INFO_POD_LINK_1_C1_ID_TABLE",
    "LE": "INFO_POD_LINK_1_C2_ID",
    "LF": "INFO_POD_LINK_1_C2_ID_TABLE",
    "LG": "INFO_POD_LINK_2_ID",
    "LH": "INFO_POD_LINK_2_DISPLAY_TEXT",
    "LI": "INFO_POD_LINK_2_C1_ID",
    "LJ": "INFO_POD_LINK_2_C1_ID_TABLE",
    "LK": "INFO_POD_LINK_2_C2_ID",
    "LL": "INFO_POD_LINK_2_C2_ID_TABLE",
    "LM": "POD_ENCODED_URL_1",
    "LN": "POD_ENCODED_URL_2",
    "LO": "DEFAULT_OPEN_LEFT",
    "LP": "LIVE_IN_PLAY",
    "LQ": "INFO_POD_LINK_1_C3_ID_TABLE",
    "LR": "INFO_POD_LINK_1_C3_SECTION_ID",
    "LS": "PREVIOUS_SET_SCORE",
    "MA": "MARKET",
    "MB": "BET_CALL_V2_DISABLED",
    "MC": "CUSTOMER_TO_CUSTOMER_CALLING_FEATURE_DISABLED",
    "MD": "MATCHLIVE_PERIOD",
    "ME": "MULTI_EVENT",
    "MF": "MATCH_FLAG",
    "MG": "MARKET_GROUP",
    "ML": "MATCH_LENGTH",
    "MM": "MERGE_MARKET",
    "MO": "SECONDARY_UK_EVENT",
    "MP": "MATCH_POSTPONED",
    "MR": "CUSTOMER_TO_REPRESENTATIVE_CALLING_FEATURE_DISABLED",
    "MS": "MEDIA_ID",
    "MT": "BET_CALL_V2_TWILIO_DISABLED",
    "MU": "MULTILINE",
    "MW": "LOTTO_MAX_WINNINGS",
    "MY": "MARKET_STYLE",
    "N2": "NAME2",
    "NA": "NAME",
    "NC": "CLOTH_NUMBER",
    "NG": "NGENERA",
    "NH": "NEXT_HEADER",
    "NM": "NON_MATCH_BASED",
    "NR": "NON_RUNNER",
    "NT": "NEUTRAL_VENUE_TEXT",
    "NV": "NEUTRAL_VENUE",
    "OB": "BANKER_OPTION",
    "OD": "ODDS",
    "OH": "ODDS_HISTORY",
    "OO": "ODDS_OVERRIDE",
    "OP": "OPEN_BETS_PRESENTATION_PULL_DISABLED",
    "OR": "ORDER",
    "OT": "OTHERS_AVAILABLE",
    "PA": "PARTICIPANT",
    "PB": "PUSH_BALANCE_ENABLED",
    "PC": "PAGE_DATA_1",
    "PD": "PAGE_DATA",
    "PE": "PARTICIPANTS_EXCEEDED",
    "PF": "PUSH_FLAG",
    "PG": "PENALTY_GOALS",
    "PH": "PHONE_ONLY",
    "PI": "PLAYING_INDICATOR",
    "PN": "CLOTH_NUMBER_PULL",
    "PO": "POD_STACK_ORDER",
    "PP": "POD_OPEN",
    "PR": "PREFERENCE_ID",
    "PS": "POD_STACK",
    "PT": "PRODUCT_TYPE",
    "PV": "PREMIUM_VERSION",
    "PX": "NO_OFFER",
    "PY": "PARTICIPANT_STYLE",
    "RA": "RANGE",
    "RC": "RESULT_CODE",
    "RD": "RACE_DETAILS",
    "RE": "BET_RETURNS",
    "RG": "REGION",
    "RI": "R4_COMMENT",
    "RO": "DEFAULT_OPEN_RIGHT",
    "RS": "RUNNER_STATUS",
    "RT": "RESULTS_TEXT",
    "S1": "MATCHLIVE_STATS_1",
    "S2": "MATCHLIVE_STATS_2",
    "S3": "MATCHLIVE_STATS_3",
    "S4": "MATCHLIVE_STATS_4",
    "S5": "MATCHLIVE_STATS_5",
    "S6": "MATCHLIVE_STATS_6",
    "S7": "MATCHLIVE_STATS_7",
    "S8": "MATCHLIVE_STATS_8",
    "SA": "CHANGE_STAMP",
    "SB": "SCOREBOARD_TYPE",
    "SC": "SCORE",
    "SD": "AUDIO_ID",
    "SE": "SECONDARY_EVENT",
    "SF": "SPOTLIGHT_FORM",
    "SG": "STAT_GROUP",
    "SI": "IMAGE_ID_PULL",
    "SL": "SCORES_CELL",
    "SM": "START_TIME",
    "SN": "DRAW_NUMBER_PULL",
    "SP": "STAT_PERIOD",
    "SS": "SHORT_SCORE",
    "ST": "INFO_POD_DETAIL_1",
    "SU": "SUCCESS",
    "SV": "MATCHLIVE_AVAILABLE",
    "SY": "STYLE",
    "SZ": "STAT_LOCATION",
    "T1": "C1_TABLE",
    "T2": "C2_TABLE",
    "T3": "MINI_DIARY_T3",
    "T4": "TEXT_4",
    "T5": "TEXT_5",
    "TA": "TIME_ADDED",
    "TB": "BREADCRUMB_TRAIL",
    "TC": "BET_TOTE_TYPE",
    "TD": "COUNTDOWN",
    "TE": "TEAM",
    "TG": "TEAM_GROUP",
    "TI": "TMR_SERVER",
    "TL": "LEAGUE_TOPIC",
    "TM": "STAT_TIME",
    "TN": "TRAINER_NAME",
    "TO": "EMPTY_TOPIC_ID",
    "TP": "TIME_STAMP",
    "TR": "TAX_RATE",
    "TS": "TMR_SECS",
    "TT": "TMR_TICKING",
    "TU": "TMR_UPDATED",
    "TX": "TAX_METHOD",
    "UC": "CURRENT_INFO_V4",
    "UF": "UPDATE_FREQUENCY",
    "VA": "VALUE",
    "VC": "MATCHLIVE_ANIMATION",
    "VD": "VIRTUAL_DATA",
    "VI": "VIDEO_AVAILABLE",
    "VL": "VISIBLE",
    "VR": "VIRTUAL_RACE",
    "VS": "VIDEO_STREAM",
    "WG": "WIZE_GUY",
    "WM": "WINNING_MARGIN",
    "XB": "CHECK_BOX",
    "XC": "EXCLUDE_COLUMN_NUMBERS",
    "XI": "EXTRA_INFO_NODE",
    "XL": "CONTROLLER",
    "XP": "SHORT_POINTS",
    "XT": "EXTRA_TIME_LENGTH",
    "XY": "MATCHLIVE_COORDINATES",
    "ZA": "TIMEZONE_ADJUSTMENT",
    "_V": "PADDOCK_VIDEO_AVAILABLE",
    "UNDEFINED": "EVENT_TYPE",
}

language = "en"

if language == "cn":
    DATA = {"C1A_10_0": [], "C18A_10_0": [], "C13A_10_0": []}
    SUFFIX = "_10_0"
elif language == "en":
    DATA = {"C1A_6_0": [], "C18A_6_0": []}
    SUFFIX = "_6_0"
elif language == "gr":
    DATA = {"C1A_20_0": [], "C18A_20_0": []}
    SUFFIX = "_20_0"
else:
    DATA = {"C1A_6_0": [], "C18A_6_0": []}
    SUFFIX = "_6_0"


def calculate_time_offset():
    tz = pytz.timezone("Europe/Rome")
    now = datetime.now(tz)
    return 7*3600 if now.dst() != timedelta(0) else 8*3600


def to_dit(txt):
    d = {}
    txt = txt.rstrip('|')
    for p in txt.split(';'):
        if '=' in p:
            k, v = p.split('=', 1)
            d[k] = v
    return d


def handle_insert(it, obj, ch):
    if it not in DATA[ch]:
        DATA[ch].append(it)
        DATA[it] = obj


def update_data(target, txt):
    action, payload = txt.split('|', 1)
    typ = payload[:2]
    if action == 'U':
        d = to_dit(payload)
        if target in DATA and target.endswith(SUFFIX):
            DATA[target].update(d)
    elif action == 'I':
        d = to_dit(payload[3:])
        it = d.get('IT')
        if not it:
            return
        if typ == 'EV':
            ch = f"C1A{SUFFIX}" if it.endswith(f"C1A{SUFFIX}") else f"C18A{SUFFIX}"
            handle_insert(it, d, ch)
        elif typ in ('PA', 'MA'):
            DATA[it] = d
    elif action == 'D':
        it = target.split('/')[-1]
        for ch in (f"C1A{SUFFIX}", f"C18A{SUFFIX}"):
            if it in DATA.get(ch, []):
                DATA[ch].remove(it)
        DATA.pop(it, None)


def init_data(txt):
    for item in txt.split('|')[1:]:
        if not item.strip():
            continue
        typ = item[:2]
        obj = to_dit(item[3:])
        it = obj.get('IT')
        if not it:
            continue
        if typ == 'EV':
            ch = f"C1A{SUFFIX}" if it.endswith(f"C1A{SUFFIX}") else f"C18A{SUFFIX}"
            handle_insert(it, obj, ch)
        elif typ in ('PA', 'MA'):
            DATA[it] = obj


def data_parse(txt):
    if not txt.startswith(('\x14', '\x15')):
        return
    for part in txt.split('|\x08'):
        p = part.strip()
        arr = p[1:].split('\x01', 1)
        if len(arr) < 2:
            continue
        key, val = arr
        if p.startswith('\x14OVInPlay_'):
            global DATA
            DATA = {f"C1A{SUFFIX}": [], f"C18A{SUFFIX}": []}
            init_data(val)
        elif p.startswith('\x15'):
            update_data(key, val)


def extract_odds(ev_fi):
    odds = []
    for key, obj in DATA.items():
        if not isinstance(obj, dict):
            continue
        if obj.get('FI') != ev_fi:
            continue
        raw_frac = obj.get('OD')
        if not raw_frac:
            continue
        try:
            num, den = raw_frac.split('/')
            decimal_odd = round(float(num) / float(den) + 1, 3)
        except:
            decimal_odd = None
        try:
            order = int(obj.get('OR', 0))
        except:
            order = 0
        odds.append({'id': obj.get('ID'), 'decimal': decimal_odd, 'order': order})
    return sorted(odds, key=lambda x: x['order'])



def extract_markets(ev_fi):
    markets = []
    for obj in DATA.values():
        if isinstance(obj, dict) and obj.get('FI') == ev_fi and obj.get('MA'):
            markets.append({
                'market_id': obj.get('ID'),
                'market_name': obj.get('NA')
            })
    return markets


def soccer_data():
    live_list = []
    suffix_key = f"C1A{SUFFIX}"
    # Iterate all DATA items, but only those EV keys ending with C1A{SUFFIX}
    for ev_it, info in DATA.items():
        if not isinstance(info, dict):
            continue
        if not ev_it.endswith(suffix_key):
            continue

        ev_fi = info.get('OI') or info.get('C3') or info.get('FI')
        # Time & period calculation
        try:
            TU = info['TU']
            TT = int(info.get('TT', 0))
            TS = int(info.get('TS', 0))
            TM = int(info.get('TM', 0))
            MD = info.get('MD', '0')
            begin_ts = time.mktime(time.strptime(TU, '%Y%m%d%H%M%S'))
            now_ts = time.time() - calculate_time_offset()
            if TM == 0 and TT == 0:
                rel_time = '00:00'
            elif TT == 1:
                rel_time = f"{int((now_ts - begin_ts) / 60) + TM}:{int((now_ts - begin_ts) % 60):02d}"
            else:
                rel_time = f"{TM}:{TS:02d}"

            total_mins = 90
            league = info.get('CT', '')
            if "mins play" in league:
                total_mins = int(league.split(" - ")[1].split()[0])

            if TM == total_mins / 2 and TS == 0 and TT == 0 and MD == "1":
                period = "HalfTime"
            elif TM == total_mins and TS == 0 and TT == 0 and MD == "1":
                period = "FullTime"
            elif TM == 0 and TS == 0 and TT == 0 and MD == "0":
                period = "ToStart"
            else:
                period = "FirstHalf" if MD == "0" else "SecondHalf"
        except:
            rel_time = '00:00'
            period = 'ToStart'

        markets = extract_markets(ev_fi)
        odds_list = extract_odds(ev_fi)
        web_page_id = f"EV15{info.get('C2')}2C1"

        live_list.append({
            'event': info.get('NA'),
            'fi': ev_fi,
            'id': info.get('C2'),
            'league': info.get('CT'),
            'time': rel_time,
            'score': info.get('SS', ''),
            'period': period,
            'markets': markets,
            'odds': odds_list,
            'web_page_id': web_page_id
        })
    return live_list


def basketball_data():
    live_list = []
    suffix_key = f"C18A{SUFFIX}"
    # Iterate all DATA items, but only those EV keys ending with C18A{SUFFIX}
    for ev_it, info in DATA.items():
        if not isinstance(info, dict):
            continue
        if not ev_it.endswith(suffix_key):
            continue

        ev_fi = info.get('OI') or info.get('FI')

        try:
            TU = info['TU']
            TT = int(info.get('TT', 0))
            TS = int(info.get('TS', 0))
            TM = int(info.get('TM', 0))
            begin_ts = time.mktime(time.strptime(TU, '%Y%m%d%H%M%S'))
            now_ts = time.time() - calculate_time_offset()
            if TT == 1 and now_ts - begin_ts >= TS:
                rel_time = f"{TM-1}:{int((60 + TS + begin_ts - now_ts)):02d}"
            elif TT == 1:
                rel_time = f"{TM}:{int((TS + begin_ts - now_ts)):02d}"
            else:
                rel_time = f"{TM}:{TS:02d}"
        except:
            rel_time = '00:00'

        markets = extract_markets(ev_fi)
        odds_list = extract_odds(ev_fi)
        web_page_id = f"EV15{info.get('C2')}5C18"

        live_list.append({
            'event': info.get('NA'),
            'fi': ev_fi,
            'id': info.get('C2'),
            'league': info.get('CT'),
            'time': rel_time,
            'score': info.get('SS', ''),
            'period': info.get('CP'),
            'markets': markets,
            'odds': odds_list,
            'web_page_id': web_page_id
        })
    return live_list

def tennis_data():
    live_list = []
    suffix_key = f"C13A{SUFFIX}"
    for ev_it, info in DATA.items():
        if not isinstance(info, dict):
            continue
        if not ev_it.endswith(suffix_key):
            continue

        ev_fi = info.get('OI') or info.get('FI')

        try:
            TU = info['TU']
            TT = int(info.get('TT', 0))
            TS = int(info.get('TS', 0))
            TM = int(info.get('TM', 0))
            begin_ts = time.mktime(time.strptime(TU, '%Y%m%d%H%M%S'))
            now_ts = time.time() - calculate_time_offset()
            if TM == 0 and TT == 0:
                rel_time = '00:00'
            elif TT == 1:
                rel_time = f"{int((now_ts - begin_ts) / 60) + TM}:{int((now_ts - begin_ts) % 60):02d}"
            else:
                rel_time = f"{TM}:{TS:02d}"
        except:
            rel_time = '00:00'
        period = info.get('CP', '')

        markets = extract_markets(ev_fi)
        odds_list = extract_odds(ev_fi)
        web_page_id = f"EV15{info.get('C2')}3C13"

        live_list.append({
            'event': info.get('NA'),
            'fi': ev_fi,
            'id': info.get('C2'),
            'it': info.get('IT'),
            'league': info.get('CT'),
            'time': rel_time,
            'score': info.get('SS', ''),
            'period': period,
            'markets': markets,
            'odds': odds_list,
            'web_page_id': web_page_id
        })
    return live_list


@app.route('/data', methods=['GET', 'POST'])
def handle_data():
    ts = datetime.now().isoformat()
    if request.method == 'POST':
        raw = request.get_data(as_text=True)
        # 1) Log generale
        with open('raw_logs.txt', 'a', encoding='utf-8') as f:
            f.write(f"{ts} - POST /data - {raw}\n")
        # 3) Parsifichiamo come sempre
        try:
            data_parse(request.json.get("data", ""))
        except Exception as e:
            print(f"Error parsing data: {e}")
        return "1"
    else:
        out = jsonify(DATA).get_data(as_text=True)
        with open('raw_logs.txt', 'a', encoding='utf-8') as f:
            f.write(f"{ts} - GET /data - {out}\n")
        return jsonify(DATA), 200

@app.route('/live', methods=['GET'])
def live_event():
    sport = request.args.get("sport")
    if sport == "1":
        return jsonify(soccer_data()), 200
    elif sport == "18":
        return jsonify(basketball_data()), 200
    elif sport == "13":
        return jsonify(tennis_data()), 200
    else:
        return jsonify([]), 200

if __name__ == '__main__':
    CORS(app)
    app.run(host='0.0.0.0', port=8485, threaded=True, debug=False)