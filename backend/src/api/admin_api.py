import asyncio
import json
import os
import urllib.parse
import httpx
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

PET_TOUR_API_BASE  = "https://apis.data.go.kr/B551011/KorPetTourService2"
TOUR_API_BASE      = "https://apis.data.go.kr/B551011/KorService2"

BARRIER_FREE_API_BASE = "https://apis.data.go.kr/B551011/KorWithService2"

# KorWithService2 엔드포인트 탐색 후보
TOUR_PROBE_VARIANTS: list[tuple[str, str]] = [
    (BARRIER_FREE_API_BASE, "locationBasedList2"),
    (BARRIER_FREE_API_BASE, "areaBasedList2"),
    (BARRIER_FREE_API_BASE, "detailWithTour2"),
    (BARRIER_FREE_API_BASE, "searchKeyword2"),
    (BARRIER_FREE_API_BASE, "detailCommon2"),
]
_ACCESSIBILITY_FIELDS = ("wheelchair", "elevator", "parkinglot", "route", "exit")

router = APIRouter(prefix="/admin", tags=["admin"])


CANDIDATE_ENDPOINTS = [
    "petTourLocationBasedList2",
    "petTourBasedList2",
    "locationBasedList2",
    "petTourList2",
    "petTourDetailList2",
    "petTourSearchList2",
]


async def _probe_endpoint(api_key: str, operation: str, extra_params: dict) -> tuple[int, str, str]:
    """엔드포인트 하나를 호출해 (HTTP 상태코드, resultCode, 응답 앞 200자)를 반환한다."""
    params = {
        "numOfRows": 3,
        "pageNo":    1,
        "MobileOS":  "ETC",
        "MobileApp": "GONYADI",
        "_type":     "json",
        **extra_params,
    }
    url = f"{PET_TOUR_API_BASE}/{operation}?serviceKey={api_key}&{urllib.parse.urlencode(params)}"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
        status = resp.status_code
        preview = resp.text[:200]
        try:
            result_code = resp.json().get("response", {}).get("header", {}).get("resultCode", "?")
        except Exception:
            result_code = "JSON파싱실패"
        return status, result_code, preview
    except Exception as e:
        return 0, "연결실패", str(e)[:200]


async def _raw_pet_tour(extra_params: dict) -> tuple[dict, str, str]:
    api_key = os.getenv("TOUR_API_KEY", "").strip()
    if not api_key:
        return {}, "TOUR_API_KEY 환경변수 없음", ""

    other_params = {
        "numOfRows": 20,
        "pageNo":    1,
        "MobileOS":  "ETC",
        "MobileApp": "GONYADI",
        "_type":     "json",
        **extra_params,
    }
    query_string = urllib.parse.urlencode(other_params)
    url = f"{PET_TOUR_API_BASE}/locationBasedList2?serviceKey={api_key}&{query_string}"
    display_url = f"{PET_TOUR_API_BASE}/locationBasedList2?serviceKey=***API_KEY***&{query_string}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
        raw_text = resp.text
        try:
            return resp.json(), display_url, raw_text
        except Exception:
            return {"_parse_error": "JSON 파싱 실패", "_status": resp.status_code}, display_url, raw_text
    except Exception as e:
        return {"error": str(e)}, display_url, ""


def _extract_items(raw: dict) -> list[dict]:
    body = raw.get("response", {}).get("body", {})
    items = body.get("items") or {}
    if isinstance(items, str):
        return []
    item_list = items.get("item", [])
    if isinstance(item_list, dict):
        item_list = [item_list]
    return item_list if isinstance(item_list, list) else []


def _get_error_msg(raw: dict) -> str:
    header = raw.get("response", {}).get("header", {})
    code = header.get("resultCode", "")
    msg  = header.get("resultMsg", "")
    if code and code != "0000":
        return f"[{code}] {msg}"
    return ""


def _make_rows(items: list[dict]) -> str:
    if not items:
        return '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px">결과 없음</td></tr>'
    rows = ""
    for i, p in enumerate(items, 1):
        rows += (
            f"<tr><td>{i}</td>"
            f"<td><strong>{p.get('title','')}</strong></td>"
            f"<td>{p.get('addr1','')}</td>"
            f"<td>{p.get('mapy','')}</td>"
            f"<td>{p.get('mapx','')}</td>"
            f"<td>{p.get('contenttypeid','')}</td></tr>"
        )
    return rows


def _esc(text: str, limit: int = 3000) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")[:limit]


@router.get("/pet-places", response_class=HTMLResponse)
async def pet_places_check(
    lat: float = 37.5665,
    lng: float = 126.9780,
    radius_km: float = 15.0,
):
    radius_m = int(radius_km * 1000)
    api_key  = os.getenv("TOUR_API_KEY", "").strip()

    # 엔드포인트 후보 병렬 탐색
    probe_tasks = [_probe_endpoint(api_key, ep, {"mapX": lng, "mapY": lat, "radius": radius_m}) for ep in CANDIDATE_ENDPOINTS]
    probe_results = await asyncio.gather(*probe_tasks)
    probe_rows = ""
    working_ep = None
    for ep, (status, rc, preview) in zip(CANDIDATE_ENDPOINTS, probe_results):
        ok = status == 200 and rc == "0000"
        color = "#1a7a60" if ok else "#c0392b"
        if ok and working_ep is None:
            working_ep = ep
        probe_rows += (
            f'<tr><td style="font-family:monospace">{ep}</td>'
            f'<td style="color:{color};font-weight:bold">{status} / {rc}</td>'
            f'<td style="font-size:11px;color:#666">{_esc(preview, 80)}</td></tr>'
        )

    loc_raw, loc_url, loc_text = await _raw_pet_tour({"mapX": lng, "mapY": lat, "radius": radius_m})
    all_raw, all_url, all_text = await _raw_pet_tour({})

    loc_items = _extract_items(loc_raw)
    all_items = _extract_items(all_raw)
    loc_error = _get_error_msg(loc_raw)
    all_error = _get_error_msg(all_raw)

    loc_rows     = _make_rows(loc_items)
    all_rows     = _make_rows(all_items[:20])
    loc_raw_json = _esc(json.dumps(loc_raw, ensure_ascii=False, indent=2))
    all_raw_json = _esc(json.dumps(all_raw, ensure_ascii=False, indent=2))
    loc_text_esc = _esc(loc_text)
    all_text_esc = _esc(all_text)

    api_key_status  = "✅ 설정됨" if os.getenv("TOUR_API_KEY") else "❌ 없음"
    loc_count       = len(loc_items)
    all_count       = len(all_items)
    loc_err_block   = f'<div class="status err">오류: {loc_error}</div>' if loc_error else ""
    all_err_block   = f'<div class="status err">오류: {all_error}</div>' if all_error else ""
    all_status_cls  = "warn" if not all_items else "ok"
    all_status_msg  = "전국 조회도 0건 → API 키 오류 또는 petTour1 미지원" if not all_items else f"전국에 {all_count}건 존재"

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>petTour1 디버그</title>
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:'Segoe UI',sans-serif;background:#f5f7fa;color:#222;padding:28px}}
    h1{{font-size:20px;font-weight:700;margin-bottom:20px}}
    h2{{font-size:15px;font-weight:700;margin:24px 0 10px}}
    .card{{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:20px}}
    .status{{font-size:13px;padding:4px 10px;border-radius:6px;display:inline-block;margin-bottom:12px}}
    .ok{{background:#e8faf5;color:#1a7a60}}.err{{background:#fff0f0;color:#c0392b}}.warn{{background:#fff8e1;color:#b07d00}}
    .form{{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}}
    .field{{display:flex;flex-direction:column;gap:3px}}
    .field label{{font-size:11px;color:#666;font-weight:600}}
    .field input{{border:1px solid #ddd;border-radius:8px;padding:7px 11px;font-size:13px;width:140px}}
    .field input:focus{{border-color:#1ABC9C;outline:none}}
    .btn{{background:#1ABC9C;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer}}
    .btn:hover{{background:#17a589}}
    .preset{{background:#f0f0f0;color:#333;font-size:11px;border-radius:6px;padding:5px 11px;cursor:pointer;border:none}}
    .preset:hover{{background:#ddd}}
    .presets{{display:flex;gap:6px;flex-wrap:wrap;align-items:center}}
    table{{width:100%;border-collapse:collapse}}
    th{{background:#1ABC9C;color:#fff;text-align:left;padding:10px 14px;font-size:12px}}
    td{{padding:9px 14px;font-size:12px;border-bottom:1px solid #f0f0f0}}
    tr:last-child td{{border-bottom:none}}
    tr:hover td{{background:#f9fffe}}
    .url{{font-size:11px;color:#888;word-break:break-all;margin-bottom:10px;background:#f8f8f8;padding:8px 12px;border-radius:6px}}
    details{{margin-top:12px}}
    summary{{font-size:12px;color:#1ABC9C;cursor:pointer}}
    pre{{font-size:11px;background:#1e1e1e;color:#d4d4d4;padding:14px;border-radius:8px;overflow:auto;max-height:300px;margin-top:8px}}
    .stat-val{{font-size:24px;font-weight:700;color:#1ABC9C}}
    .stat-lbl{{font-size:12px;color:#666;margin-top:2px}}
    .stats{{display:flex;gap:32px;margin-bottom:16px}}
  </style>
</head>
<body>
  <h1>&#x1F43E; petTour1 API 디버그</h1>

  <div class="card">
    <div class="stats">
      <div><div class="stat-val">{api_key_status}</div><div class="stat-lbl">TOUR_API_KEY</div></div>
      <div><div class="stat-val">{loc_count}</div><div class="stat-lbl">좌표 기반 결과</div></div>
      <div><div class="stat-val">{all_count}</div><div class="stat-lbl">전국 조회 결과</div></div>
    </div>

    <h2 style="margin:16px 0 8px">엔드포인트 탐색 결과</h2>
    <table>
      <thead><tr><th>operation</th><th>HTTP / resultCode</th><th>응답 미리보기</th></tr></thead>
      <tbody>{probe_rows}</tbody>
    </table>
    <div class="form">
      <div class="field"><label>위도</label><input id="lat" type="number" step="0.0001" value="{lat}"></div>
      <div class="field"><label>경도</label><input id="lng" type="number" step="0.0001" value="{lng}"></div>
      <div class="field"><label>반경(km)</label><input id="r" type="number" step="1" min="1" max="50" value="{radius_km}"></div>
      <button class="btn" onclick="go()">조회</button>
      <div class="presets">
        <button class="preset" onclick="sc(37.5665,126.9780)">서울</button>
        <button class="preset" onclick="sc(35.8714,128.6014)">대구</button>
        <button class="preset" onclick="sc(35.8562,129.2247)">경주</button>
        <button class="preset" onclick="sc(35.1796,129.0756)">부산</button>
        <button class="preset" onclick="sc(33.4890,126.4983)">제주</button>
      </div>
    </div>
  </div>

  <h2>① 좌표 기반 조회 (mapX/mapY/radius)</h2>
  <div class="card">
    {loc_err_block}
    <div class="url">요청 URL: {loc_url}</div>
    <table><thead><tr><th>#</th><th>장소명</th><th>주소</th><th>위도</th><th>경도</th><th>타입ID</th></tr></thead>
    <tbody>{loc_rows}</tbody></table>
    <details><summary>raw JSON</summary><pre>{loc_raw_json}</pre></details>
    <details><summary>raw 응답 텍스트</summary><pre>{loc_text_esc}</pre></details>
  </div>

  <h2>② 전국 조회 (위치 파라미터 없음)</h2>
  <div class="card">
    <div class="status {all_status_cls}">{all_status_msg}</div>
    {all_err_block}
    <div class="url">요청 URL: {all_url}</div>
    <table><thead><tr><th>#</th><th>장소명</th><th>주소</th><th>위도</th><th>경도</th><th>타입ID</th></tr></thead>
    <tbody>{all_rows}</tbody></table>
    <details><summary>raw JSON</summary><pre>{all_raw_json}</pre></details>
    <details><summary>raw 응답 텍스트</summary><pre>{all_text_esc}</pre></details>
  </div>

  <script>
    function sc(la,ln){{document.getElementById('lat').value=la;document.getElementById('lng').value=ln;}}
    function go(){{
      const la=document.getElementById('lat').value,ln=document.getElementById('lng').value,r=document.getElementById('r').value;
      location.href='/admin/pet-places?lat='+la+'&lng='+ln+'&radius_km='+r;
    }}
  </script>
</body>
</html>"""
    return html


# ── Barrier-free admin helpers ───────────────────────────────────────────────

async def _bf_location_call(api_key: str, lng: float, lat: float, radius_m: int, ct_id: int | None = None):
    """KorWithService2/locationBasedList2 호출.
    Returns: (items, display_url, raw_text, http_status, result_code, result_msg)
    """
    params = {
        "numOfRows": 20, "pageNo": 1,
        "MobileOS": "ETC", "MobileApp": "GONYADI", "_type": "json",
        "mapX": lng, "mapY": lat,
        "radius": radius_m,
    }
    if ct_id is not None:
        params["contentTypeId"] = ct_id
    qs = urllib.parse.urlencode(params)
    url = f"{BARRIER_FREE_API_BASE}/locationBasedList2?serviceKey={api_key}&{qs}"
    display_url = f"{BARRIER_FREE_API_BASE}/locationBasedList2?serviceKey=***&{qs}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
        raw_text = resp.text
        http_status = resp.status_code
        try:
            data = resp.json()
        except Exception:
            return [], display_url, raw_text, http_status, "JSON파싱실패", ""
        header = data.get("response", {}).get("header", {})
        result_code = header.get("resultCode", "?")
        result_msg  = header.get("resultMsg", "")
        body = data.get("response", {}).get("body", {})
        items = body.get("items") or {}
        item_list = items.get("item", [])
        if isinstance(item_list, dict):
            item_list = [item_list]
        return item_list if isinstance(item_list, list) else [], display_url, raw_text, http_status, result_code, result_msg
    except Exception as e:
        return [], display_url, str(e)[:300], 0, "연결실패", str(e)[:100]



@router.get("/barrier-free", response_class=HTMLResponse)
async def barrier_free_check(
    lat: float = 37.5665,
    lng: float = 126.9780,
    radius_km: float = 15.0,
):
    radius_m = int(radius_km * 1000)
    api_key  = os.getenv("TOUR_API_KEY", "").strip()
    api_key_status = "✅ 설정됨" if api_key else "❌ 없음"

    if not api_key:
        return HTMLResponse("<h1>TOUR_API_KEY 없음</h1>", status_code=500)

    # ── KorService1 URL/엔드포인트 탐색 ──────────────────────────────────────
    async def _probe_tour(base: str, op: str) -> tuple[int, str, str]:
        params = {
            "numOfRows": 3, "pageNo": 1,
            "MobileOS": "ETC", "MobileApp": "GONYADI", "_type": "json",
            "mapX": lng, "mapY": lat, "radius": radius_m,
        }
        url = f"{base}/{op}?serviceKey={api_key}&{urllib.parse.urlencode(params)}"
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url)
            status = resp.status_code
            preview = resp.text[:120]
            try:
                rc = resp.json().get("response", {}).get("header", {}).get("resultCode", "?")
            except Exception:
                rc = "JSON파싱실패"
            return status, rc, preview
        except Exception as e:
            return 0, "연결실패", str(e)[:120]

    probe_tasks = [_probe_tour(base, op) for base, op in TOUR_PROBE_VARIANTS]
    probe_results = await asyncio.gather(*probe_tasks)

    probe_rows = ""
    for (base, op), (status, rc, preview) in zip(TOUR_PROBE_VARIANTS, probe_results):
        ok = status == 200 and rc == "0000"
        color = "#1a7a60" if ok else ("#b07d00" if status == 200 else "#c0392b")
        label = f"{base}/{op}"
        probe_rows += (
            f'<tr><td style="font-family:monospace;font-size:11px">{label}</td>'
            f'<td style="color:{color};font-weight:bold">{status} / {rc}</td>'
            f'<td style="font-size:11px;color:#666">{_esc(preview, 100)}</td></tr>'
        )

    # KorWithService2/locationBasedList2 단일 호출 (무장애 전용 API — 전원 is_accessible)
    items, main_url, raw_text, http_status, rc_main, rm_main = await _bf_location_call(
        api_key, lng, lat, radius_m, ct_id=None
    )
    total_count = len(items)
    rc_cls = "ok" if rc_main == "0000" else "err"

    def _place_row(i: int, item: dict) -> str:
        name = item.get("title", "")
        addr = item.get("addr1", "")
        ct   = item.get("contenttypeid", "")
        return (
            f"<tr><td>{i}</td><td><strong>{name}</strong></td><td>{addr}</td>"
            f"<td>{ct}</td>"
            f"<td><span style='background:#e8faf5;color:#1a7a60;padding:2px 8px;border-radius:6px;font-size:11px'>is_accessible=True</span></td></tr>"
        )

    rows_html = "".join(_place_row(i, item) for i, item in enumerate(items, 1))
    if not rows_html:
        rows_html = '<tr><td colspan="5" style="text-align:center;color:#999;padding:20px">결과 없음</td></tr>'

    raw_esc = _esc(raw_text, 3000)

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>무장애 API 디버그</title>
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:'Segoe UI',sans-serif;background:#f5f7fa;color:#222;padding:28px}}
    h1{{font-size:20px;font-weight:700;margin-bottom:20px}}
    h2{{font-size:15px;font-weight:700;margin:24px 0 10px}}
    .card{{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:20px}}
    .status{{font-size:13px;padding:4px 10px;border-radius:6px;display:inline-block;margin-bottom:12px}}
    .ok{{background:#e8faf5;color:#1a7a60}}.err{{background:#fff0f0;color:#c0392b}}.warn{{background:#fff8e1;color:#b07d00}}
    .form{{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-top:16px}}
    .field{{display:flex;flex-direction:column;gap:3px}}
    .field label{{font-size:11px;color:#666;font-weight:600}}
    .field input{{border:1px solid #ddd;border-radius:8px;padding:7px 11px;font-size:13px;width:140px}}
    .field input:focus{{border-color:#5B8CFF;outline:none}}
    .btn{{background:#5B8CFF;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer}}
    .btn:hover{{background:#3d72ff}}
    .preset{{background:#f0f0f0;color:#333;font-size:11px;border-radius:6px;padding:5px 11px;cursor:pointer;border:none}}
    .preset:hover{{background:#ddd}}
    .presets{{display:flex;gap:6px;flex-wrap:wrap;align-items:center}}
    table{{width:100%;border-collapse:collapse}}
    th{{background:#5B8CFF;color:#fff;text-align:left;padding:10px 14px;font-size:12px}}
    td{{padding:9px 14px;font-size:12px;border-bottom:1px solid #f0f0f0;vertical-align:top}}
    tr:last-child td{{border-bottom:none}}
    tr:hover td{{background:#f8f9ff}}
    .url{{font-size:11px;color:#888;word-break:break-all;margin-bottom:10px;background:#f8f8f8;padding:8px 12px;border-radius:6px}}
    details{{margin-top:6px}}
    summary{{font-size:12px;color:#5B8CFF;cursor:pointer}}
    pre{{font-size:11px;background:#1e1e1e;color:#d4d4d4;padding:14px;border-radius:8px;overflow:auto;max-height:300px;margin-top:8px}}
    .stat-val{{font-size:24px;font-weight:700;color:#5B8CFF}}
    .stat-lbl{{font-size:12px;color:#666;margin-top:2px}}
    .stats{{display:flex;gap:32px;margin-bottom:16px}}
    .note{{font-size:12px;color:#888;margin-top:8px}}
  </style>
</head>
<body>
  <h1>&#x267F; 무장애 (Barrier-free) API 디버그</h1>

  <div class="card">
    <div class="stats">
      <div><div class="stat-val">{api_key_status}</div><div class="stat-lbl">TOUR_API_KEY</div></div>
      <div><div class="stat-val">{total_count}</div><div class="stat-lbl">무장애 장소 (전원 인증)</div></div>
    </div>
    <h2 style="margin:0 0 8px">KorWithService2 엔드포인트 탐색</h2>
    <table>
      <thead><tr><th>URL / 엔드포인트</th><th>HTTP / resultCode</th><th>응답 미리보기</th></tr></thead>
      <tbody>{probe_rows}</tbody>
    </table>
    <div style="margin-top:16px">
      <div class="status {rc_cls}">locationBasedList2: HTTP {http_status} / {rc_main} {rm_main}</div>
    </div>

    <div class="form">
      <div class="field"><label>위도</label><input id="lat" type="number" step="0.0001" value="{lat}"></div>
      <div class="field"><label>경도</label><input id="lng" type="number" step="0.0001" value="{lng}"></div>
      <div class="field"><label>반경(km)</label><input id="r" type="number" step="1" min="1" max="50" value="{radius_km}"></div>
      <button class="btn" onclick="go()">조회</button>
      <div class="presets">
        <button class="preset" onclick="sc(37.5665,126.9780)">서울</button>
        <button class="preset" onclick="sc(35.8714,128.6014)">대구</button>
        <button class="preset" onclick="sc(35.8562,129.2247)">경주</button>
        <button class="preset" onclick="sc(35.1796,129.0756)">부산</button>
        <button class="preset" onclick="sc(33.4890,126.4983)">제주</button>
      </div>
    </div>
  </div>

  <h2>무장애 장소 목록 (KorWithService2/locationBasedList2)</h2>
  <div class="card">
    <div class="url">{main_url}</div>
    <table>
      <thead><tr><th>#</th><th>장소명</th><th>주소</th><th>타입ID</th><th>접근성</th></tr></thead>
      <tbody>{rows_html}</tbody>
    </table>
    <details><summary>raw 응답</summary><pre>{raw_esc}</pre></details>
  </div>

  <script>
    function sc(la,ln){{document.getElementById('lat').value=la;document.getElementById('lng').value=ln;}}
    function go(){{
      const la=document.getElementById('lat').value,ln=document.getElementById('lng').value,r=document.getElementById('r').value;
      location.href='/admin/barrier-free?lat='+la+'&lng='+ln+'&radius_km='+r;
    }}
  </script>
</body>
</html>"""
    return html


# ── KorService1 (국문 관광정보) 진단 ────────────────────────────────────────────

KOR_SERVICE1_ENDPOINTS = [
    "locationBasedList2",
    "areaBasedList2",
    "searchKeyword2",
    "detailCommon2",
    "detailWithTour2",
    "searchFestival2",
]


async def _probe_kor1(api_key: str, op: str, extra: dict) -> tuple[int, str, str, str]:
    params = {
        "numOfRows": 3, "pageNo": 1,
        "MobileOS": "ETC", "MobileApp": "GONYADI", "_type": "json",
        **extra,
    }
    url = f"{TOUR_API_BASE}/{op}?serviceKey={api_key}&{urllib.parse.urlencode(params)}"
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url)
        status = resp.status_code
        preview = resp.text[:150]
        try:
            header = resp.json().get("response", {}).get("header", {})
            rc  = header.get("resultCode", "?")
            msg = header.get("resultMsg", "")
        except Exception:
            rc, msg = "JSON파싱실패", ""
        return status, rc, msg, preview
    except Exception as e:
        return 0, "연결실패", "", str(e)[:150]


@router.get("/kor-service1", response_class=HTMLResponse)
async def kor_service1_check(
    lat: float = 37.5665,
    lng: float = 126.9780,
    radius_km: float = 15.0,
):
    radius_m = int(radius_km * 1000)
    api_key  = os.getenv("TOUR_API_KEY", "").strip()
    api_key_status = "✅ 설정됨" if api_key else "❌ 없음"

    if not api_key:
        return HTMLResponse("<h1>TOUR_API_KEY 없음</h1>", status_code=500)

    endpoint_params = {
        "locationBasedList2": {"mapX": lng, "mapY": lat, "radius": radius_m},
        "areaBasedList2":     {"areaCode": 1},
        "searchKeyword2":     {"keyword": "박물관"},
        "detailCommon2":      {"contentId": "126508"},
        "detailWithTour2":    {"contentId": "126508"},
        "searchFestival2":    {"areaCode": 1},
    }

    tasks = [_probe_kor1(api_key, op, endpoint_params.get(op, {})) for op in KOR_SERVICE1_ENDPOINTS]
    results = await asyncio.gather(*tasks)

    probe_rows = ""
    ok_count = 0
    for op, (status, rc, msg, preview) in zip(KOR_SERVICE1_ENDPOINTS, results):
        ok = status == 200 and rc == "0000"
        if ok:
            ok_count += 1
        color = "#1a7a60" if ok else ("#b07d00" if status == 200 else "#c0392b")
        probe_rows += (
            f'<tr>'
            f'<td style="font-family:monospace">{op}</td>'
            f'<td style="color:{color};font-weight:bold">{status} / {rc}</td>'
            f'<td style="color:#666">{_esc(msg, 40)}</td>'
            f'<td style="font-size:11px;color:#888">{_esc(preview, 100)}</td>'
            f'</tr>'
        )

    overall_cls = "ok" if ok_count == len(KOR_SERVICE1_ENDPOINTS) else ("warn" if ok_count > 0 else "err")
    overall_msg = f"✅ {ok_count}/{len(KOR_SERVICE1_ENDPOINTS)} 엔드포인트 정상" if ok_count > 0 else "❌ 모든 엔드포인트 실패"

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>KorService1 진단</title>
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:'Segoe UI',sans-serif;background:#f5f7fa;color:#222;padding:28px}}
    h1{{font-size:20px;font-weight:700;margin-bottom:20px}}
    .card{{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:20px}}
    .status{{font-size:13px;padding:4px 10px;border-radius:6px;display:inline-block;margin-bottom:12px}}
    .ok{{background:#e8faf5;color:#1a7a60}}.err{{background:#fff0f0;color:#c0392b}}.warn{{background:#fff8e1;color:#b07d00}}
    .stats{{display:flex;gap:32px;margin-bottom:16px}}
    .stat-val{{font-size:24px;font-weight:700;color:#4A90D9}}
    .stat-lbl{{font-size:12px;color:#666;margin-top:2px}}
    table{{width:100%;border-collapse:collapse}}
    th{{background:#4A90D9;color:#fff;text-align:left;padding:10px 14px;font-size:12px}}
    td{{padding:9px 14px;font-size:12px;border-bottom:1px solid #f0f0f0}}
    tr:last-child td{{border-bottom:none}}
    tr:hover td{{background:#f5f9ff}}
    .form{{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-top:20px}}
    .field{{display:flex;flex-direction:column;gap:3px}}
    .field label{{font-size:11px;color:#666;font-weight:600}}
    .field input{{border:1px solid #ddd;border-radius:8px;padding:7px 11px;font-size:13px;width:140px}}
    .btn{{background:#4A90D9;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer}}
    .preset{{background:#f0f0f0;color:#333;font-size:11px;border-radius:6px;padding:5px 11px;cursor:pointer;border:none}}
    .presets{{display:flex;gap:6px;flex-wrap:wrap;align-items:center}}
    .note{{font-size:11px;color:#999;margin-top:8px}}
  </style>
</head>
<body>
  <h1>&#x1F5FA; 국문 관광정보 서비스 (KorService1) 진단</h1>

  <div class="card">
    <div class="stats">
      <div><div class="stat-val">{api_key_status}</div><div class="stat-lbl">TOUR_API_KEY</div></div>
      <div><div class="stat-val">{ok_count}/{len(KOR_SERVICE1_ENDPOINTS)}</div><div class="stat-lbl">정상 엔드포인트</div></div>
    </div>
    <div class="status {overall_cls}">{overall_msg}</div>
    <p class="note" style="margin-top:8px">Base URL: {TOUR_API_BASE}</p>

    <table style="margin-top:16px">
      <thead><tr><th>엔드포인트</th><th>HTTP / resultCode</th><th>resultMsg</th><th>응답 미리보기</th></tr></thead>
      <tbody>{probe_rows}</tbody>
    </table>

    <div class="form">
      <div class="field"><label>위도</label><input id="lat" type="number" step="0.0001" value="{lat}"></div>
      <div class="field"><label>경도</label><input id="lng" type="number" step="0.0001" value="{lng}"></div>
      <div class="field"><label>반경(km)</label><input id="r" type="number" step="1" min="1" max="50" value="{radius_km}"></div>
      <button class="btn" onclick="go()">재조회</button>
      <div class="presets">
        <button class="preset" onclick="sc(37.5665,126.9780)">서울</button>
        <button class="preset" onclick="sc(35.8714,128.6014)">대구</button>
        <button class="preset" onclick="sc(35.1796,129.0756)">부산</button>
        <button class="preset" onclick="sc(33.4890,126.4983)">제주</button>
      </div>
    </div>
  </div>

  <script>
    function sc(la,ln){{document.getElementById('lat').value=la;document.getElementById('lng').value=ln;}}
    function go(){{
      const la=document.getElementById('lat').value,ln=document.getElementById('lng').value,r=document.getElementById('r').value;
      location.href='/admin/kor-service1?lat='+la+'&lng='+ln+'&radius_km='+r;
    }}
  </script>
</body>
</html>"""
    return html
