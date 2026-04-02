from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, func, and_
from pydantic import BaseModel
from typing import Optional, List
from app.models.database import get_db, School, User
from app.services.auth_service import get_current_user

router = APIRouter()

class CreateSchoolRequest(BaseModel):
    name: str
    short_name: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    country: str = "US"
    type: str = "university"
    telegram_channel: Optional[str] = None
    telegram_group: Optional[str] = None
    website: Optional[str] = None

class BulkDeleteRequest(BaseModel):
    school_ids: List[str]

@router.get("")
async def list_schools(
    q: str = "", state: str = "", country: str = "", type: str = "",
    page: int = 1, limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(School)
    if q:
        query = query.where(or_(School.name.ilike(f"%{q}%"), School.short_name.ilike(f"%{q}%"), School.city.ilike(f"%{q}%")))
    if state:
        query = query.where(School.state == state)
    if country:
        query = query.where(School.country == country)
    if type:
        query = query.where(School.type == type)
    total = (await db.execute(select(func.count(School.id)).where(
        *([School.country == country] if country else []),
        *([School.state == state] if state else []),
    ))).scalar() or 0
    query = query.order_by(School.country, School.state, School.name).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    schools = result.scalars().all()
    return {
        "schools": [{
            "id": s.id, "name": s.name, "shortName": s.short_name,
            "state": s.state, "city": s.city, "country": s.country,
            "type": s.type, "telegramChannel": s.telegram_channel,
            "telegramGroup": s.telegram_group, "studentCount": s.student_count,
            "website": s.website, "verified": s.verified,
        } for s in schools],
        "total": total, "page": page,
    }

@router.get("/countries")
async def list_countries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(School.country, func.count(School.id)).group_by(School.country).order_by(func.count(School.id).desc()))
    return {"countries": [{"code": r[0], "count": r[1]} for r in result.fetchall()]}

@router.get("/states")
async def list_states(country: str = "US", db: AsyncSession = Depends(get_db)):
    query = select(School.state).distinct().where(and_(School.state.isnot(None), School.country == country)).order_by(School.state)
    result = await db.execute(query)
    return {"states": [r[0] for r in result.fetchall()]}

@router.get("/{school_id}")
async def get_school(school_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(School).where(School.id == school_id))
    s = result.scalar_one_or_none()
    if not s: raise HTTPException(status_code=404, detail="School not found")
    return {
        "id": s.id, "name": s.name, "shortName": s.short_name,
        "state": s.state, "city": s.city, "country": s.country,
        "type": s.type, "telegramChannel": s.telegram_channel,
        "telegramGroup": s.telegram_group, "studentCount": s.student_count,
        "website": s.website, "verified": s.verified,
    }

@router.post("")
async def create_school(req: CreateSchoolRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin only")
    existing = await db.execute(select(School).where(func.lower(School.name) == req.name.lower(), School.country == req.country))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="School already exists")
    school = School(**req.model_dump())
    db.add(school)
    await db.flush()
    await db.refresh(school)
    return {"id": school.id, "name": school.name}

@router.patch("/{school_id}")
async def update_school(school_id: str, req: CreateSchoolRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403)
    result = await db.execute(select(School).where(School.id == school_id))
    school = result.scalar_one_or_none()
    if not school: raise HTTPException(status_code=404)
    for k, v in req.model_dump(exclude_none=True).items():
        setattr(school, k, v)
    await db.flush()
    return {"message": "School updated"}

@router.delete("/{school_id}")
async def delete_school(school_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403)
    result = await db.execute(select(School).where(School.id == school_id))
    school = result.scalar_one_or_none()
    if not school: raise HTTPException(status_code=404)
    await db.delete(school)
    return {"message": "School deleted"}

@router.post("/bulk-delete")
async def bulk_delete_schools(req: BulkDeleteRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403)
    count = 0
    for sid in req.school_ids:
        result = await db.execute(select(School).where(School.id == sid))
        school = result.scalar_one_or_none()
        if school:
            await db.delete(school)
            count += 1
    await db.flush()
    return {"message": f"Deleted {count} schools"}

@router.post("/suggest")
async def suggest_school(req: CreateSchoolRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(School).where(func.lower(School.name) == req.name.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This school already exists")
    school = School(**req.model_dump(), verified=False)
    db.add(school)
    await db.flush()
    await db.refresh(school)
    return {"id": school.id, "name": school.name, "message": "School suggested! Admin will verify."}

# ═══════════════════════════════════════════════════════════════
# GLOBAL SEED DATA — batch of 50 per call, skip duplicates
# ═══════════════════════════════════════════════════════════════

GLOBAL_SCHOOLS = {
    "US": [
        # Batch 1 — Top 50
        ("Massachusetts Institute of Technology", "MIT", "MA", "Cambridge"),
        ("Stanford University", "Stanford", "CA", "Stanford"),
        ("Harvard University", "Harvard", "MA", "Cambridge"),
        ("UC Berkeley", "UCB", "CA", "Berkeley"),
        ("UCLA", "UCLA", "CA", "Los Angeles"),
        ("University of Michigan", "UMich", "MI", "Ann Arbor"),
        ("UT Austin", "UT", "TX", "Austin"),
        ("Georgia Tech", "GT", "GA", "Atlanta"),
        ("UIUC", "UIUC", "IL", "Champaign"),
        ("University of Washington", "UW", "WA", "Seattle"),
        ("Columbia University", "Columbia", "NY", "New York"),
        ("University of Pennsylvania", "UPenn", "PA", "Philadelphia"),
        ("Yale University", "Yale", "CT", "New Haven"),
        ("Princeton University", "Princeton", "NJ", "Princeton"),
        ("Carnegie Mellon University", "CMU", "PA", "Pittsburgh"),
        ("New York University", "NYU", "NY", "New York"),
        ("USC", "USC", "CA", "Los Angeles"),
        ("Duke University", "Duke", "NC", "Durham"),
        ("Northwestern University", "Northwestern", "IL", "Evanston"),
        ("University of Florida", "UF", "FL", "Gainesville"),
        ("Ohio State University", "OSU", "OH", "Columbus"),
        ("Penn State University", "Penn State", "PA", "State College"),
        ("UW-Madison", "UWM", "WI", "Madison"),
        ("Arizona State University", "ASU", "AZ", "Tempe"),
        ("UNC Chapel Hill", "UNC", "NC", "Chapel Hill"),
        ("Purdue University", "Purdue", "IN", "West Lafayette"),
        ("University of Minnesota", "UMN", "MN", "Minneapolis"),
        ("Virginia Tech", "VT", "VA", "Blacksburg"),
        ("University of Maryland", "UMD", "MD", "College Park"),
        ("Boston University", "BU", "MA", "Boston"),
        ("Texas A&M", "TAMU", "TX", "College Station"),
        ("CU Boulder", "CUB", "CO", "Boulder"),
        ("Rutgers University", "Rutgers", "NJ", "New Brunswick"),
        ("University of Pittsburgh", "Pitt", "PA", "Pittsburgh"),
        ("Indiana University", "IU", "IN", "Bloomington"),
        ("University of Arizona", "UAZ", "AZ", "Tucson"),
        ("Michigan State", "MSU", "MI", "East Lansing"),
        ("University of Iowa", "UIowa", "IA", "Iowa City"),
        ("University of Oregon", "UO", "OR", "Eugene"),
        ("Florida State", "FSU", "FL", "Tallahassee"),
        ("University of Georgia", "UGA", "GA", "Athens"),
        ("UVA", "UVA", "VA", "Charlottesville"),
        ("Brown University", "Brown", "RI", "Providence"),
        ("Cornell University", "Cornell", "NY", "Ithaca"),
        ("Rice University", "Rice", "TX", "Houston"),
        ("Vanderbilt University", "Vandy", "TN", "Nashville"),
        ("Georgetown University", "Georgetown", "DC", "Washington"),
        ("Emory University", "Emory", "GA", "Atlanta"),
        ("University of Miami", "UMiami", "FL", "Coral Gables"),
        ("Northeastern University", "NEU", "MA", "Boston"),
        # Batch 2 — 51-100
        ("UC San Diego", "UCSD", "CA", "San Diego"),
        ("UC Davis", "UCD", "CA", "Davis"),
        ("UC Irvine", "UCI", "CA", "Irvine"),
        ("UC Santa Barbara", "UCSB", "CA", "Santa Barbara"),
        ("University of Rochester", "UR", "NY", "Rochester"),
        ("Wake Forest University", "WFU", "NC", "Winston-Salem"),
        ("Tufts University", "Tufts", "MA", "Medford"),
        ("Lehigh University", "Lehigh", "PA", "Bethlehem"),
        ("Syracuse University", "Syracuse", "NY", "Syracuse"),
        ("University of Connecticut", "UConn", "CT", "Storrs"),
        ("Clemson University", "Clemson", "SC", "Clemson"),
        ("University of Alabama", "Bama", "AL", "Tuscaloosa"),
        ("LSU", "LSU", "LA", "Baton Rouge"),
        ("University of Kentucky", "UK", "KY", "Lexington"),
        ("University of Kansas", "KU", "KS", "Lawrence"),
        ("University of Oklahoma", "OU", "OK", "Norman"),
        ("University of Nebraska", "UNL", "NE", "Lincoln"),
        ("Iowa State", "ISU", "IA", "Ames"),
        ("Oregon State", "OSU-OR", "OR", "Corvallis"),
        ("Washington State", "WSU", "WA", "Pullman"),
        ("University of Utah", "UU", "UT", "Salt Lake City"),
        ("University of Tennessee", "UTK", "TN", "Knoxville"),
        ("University of South Carolina", "USC-SC", "SC", "Columbia"),
        ("University of Missouri", "Mizzou", "MO", "Columbia"),
        ("West Virginia University", "WVU", "WV", "Morgantown"),
        ("University of Cincinnati", "UC", "OH", "Cincinnati"),
        ("Temple University", "Temple", "PA", "Philadelphia"),
        ("University of Houston", "UH", "TX", "Houston"),
        ("George Washington University", "GWU", "DC", "Washington"),
        ("American University", "AU", "DC", "Washington"),
        ("Drexel University", "Drexel", "PA", "Philadelphia"),
        ("DePaul University", "DePaul", "IL", "Chicago"),
        ("Loyola University Chicago", "LUC", "IL", "Chicago"),
        ("Marquette University", "Marquette", "WI", "Milwaukee"),
        ("Villanova University", "Nova", "PA", "Villanova"),
        ("University of Denver", "DU", "CO", "Denver"),
        ("San Diego State", "SDSU", "CA", "San Diego"),
        ("San Jose State", "SJSU", "CA", "San Jose"),
        ("Cal Poly SLO", "Cal Poly", "CA", "San Luis Obispo"),
        ("Boise State", "BSU", "ID", "Boise"),
        ("University of Nevada Las Vegas", "UNLV", "NV", "Las Vegas"),
        ("University of New Mexico", "UNM", "NM", "Albuquerque"),
        ("University of Hawaii", "UH-HI", "HI", "Honolulu"),
        ("University of Alaska", "UAF", "AK", "Fairbanks"),
        ("Howard University", "Howard", "DC", "Washington"),
        ("Morehouse College", "Morehouse", "GA", "Atlanta"),
        ("Spelman College", "Spelman", "GA", "Atlanta"),
        ("Hampton University", "Hampton", "VA", "Hampton"),
        ("Florida A&M", "FAMU", "FL", "Tallahassee"),
        ("Morgan State University", "Morgan", "MD", "Baltimore"),
    ],
    "UK": [
        ("University of Oxford", "Oxford", "England", "Oxford"),
        ("University of Cambridge", "Cambridge", "England", "Cambridge"),
        ("Imperial College London", "Imperial", "England", "London"),
        ("UCL", "UCL", "England", "London"),
        ("King's College London", "KCL", "England", "London"),
        ("London School of Economics", "LSE", "England", "London"),
        ("University of Edinburgh", "Edinburgh", "Scotland", "Edinburgh"),
        ("University of Manchester", "Manchester", "England", "Manchester"),
        ("University of Bristol", "Bristol", "England", "Bristol"),
        ("University of Warwick", "Warwick", "England", "Coventry"),
        ("University of Glasgow", "Glasgow", "Scotland", "Glasgow"),
        ("University of Birmingham", "Birmingham", "England", "Birmingham"),
        ("University of Leeds", "Leeds", "England", "Leeds"),
        ("University of Sheffield", "Sheffield", "England", "Sheffield"),
        ("University of Nottingham", "Nottingham", "England", "Nottingham"),
        ("University of Southampton", "Southampton", "England", "Southampton"),
        ("University of Liverpool", "Liverpool", "England", "Liverpool"),
        ("Queen Mary University", "QMUL", "England", "London"),
        ("University of Exeter", "Exeter", "England", "Exeter"),
        ("University of York", "York", "England", "York"),
        ("Durham University", "Durham", "England", "Durham"),
        ("University of St Andrews", "St Andrews", "Scotland", "St Andrews"),
        ("University of Bath", "Bath", "England", "Bath"),
        ("Cardiff University", "Cardiff", "Wales", "Cardiff"),
        ("Queen's University Belfast", "QUB", "N. Ireland", "Belfast"),
    ],
    "CA": [
        ("University of Toronto", "UofT", "ON", "Toronto"),
        ("UBC", "UBC", "BC", "Vancouver"),
        ("McGill University", "McGill", "QC", "Montreal"),
        ("University of Waterloo", "Waterloo", "ON", "Waterloo"),
        ("University of Alberta", "UAlberta", "AB", "Edmonton"),
        ("McMaster University", "McMaster", "ON", "Hamilton"),
        ("Western University", "Western", "ON", "London"),
        ("University of Calgary", "UCalgary", "AB", "Calgary"),
        ("Queen's University", "Queens", "ON", "Kingston"),
        ("University of Ottawa", "uOttawa", "ON", "Ottawa"),
        ("Dalhousie University", "Dal", "NS", "Halifax"),
        ("Simon Fraser University", "SFU", "BC", "Burnaby"),
        ("University of Manitoba", "UManitoba", "MB", "Winnipeg"),
        ("University of Saskatchewan", "USask", "SK", "Saskatoon"),
        ("York University", "York-CA", "ON", "Toronto"),
    ],
    "AU": [
        ("University of Melbourne", "UMelb", "VIC", "Melbourne"),
        ("University of Sydney", "USyd", "NSW", "Sydney"),
        ("Australian National University", "ANU", "ACT", "Canberra"),
        ("University of Queensland", "UQ", "QLD", "Brisbane"),
        ("UNSW Sydney", "UNSW", "NSW", "Sydney"),
        ("Monash University", "Monash", "VIC", "Melbourne"),
        ("University of Western Australia", "UWA", "WA", "Perth"),
        ("University of Adelaide", "Adelaide", "SA", "Adelaide"),
        ("University of Technology Sydney", "UTS", "NSW", "Sydney"),
        ("RMIT University", "RMIT", "VIC", "Melbourne"),
    ],
    "NG": [
        ("University of Lagos", "UNILAG", "Lagos", "Lagos"),
        ("University of Ibadan", "UI", "Oyo", "Ibadan"),
        ("Obafemi Awolowo University", "OAU", "Osun", "Ile-Ife"),
        ("University of Nigeria Nsukka", "UNN", "Enugu", "Nsukka"),
        ("Ahmadu Bello University", "ABU", "Kaduna", "Zaria"),
        ("University of Benin", "UNIBEN", "Edo", "Benin City"),
        ("University of Ilorin", "UNILORIN", "Kwara", "Ilorin"),
        ("Federal University of Technology Minna", "FUT Minna", "Niger", "Minna"),
        ("Covenant University", "CU", "Ogun", "Ota"),
        ("Lagos State University", "LASU", "Lagos", "Lagos"),
        ("Babcock University", "Babcock", "Ogun", "Ilishan-Remo"),
        ("University of Port Harcourt", "UNIPORT", "Rivers", "Port Harcourt"),
        ("Federal University of Technology Akure", "FUTA", "Ondo", "Akure"),
        ("Nnamdi Azikiwe University", "UNIZIK", "Anambra", "Awka"),
        ("University of Calabar", "UNICAL", "Cross River", "Calabar"),
    ],
    "GH": [
        ("University of Ghana", "UG", "Greater Accra", "Accra"),
        ("KNUST", "KNUST", "Ashanti", "Kumasi"),
        ("University of Cape Coast", "UCC", "Central", "Cape Coast"),
        ("University for Development Studies", "UDS", "Northern", "Tamale"),
        ("Ashesi University", "Ashesi", "Eastern", "Berekuso"),
        ("Ghana Institute of Management", "GIMPA", "Greater Accra", "Accra"),
        ("University of Mines and Technology", "UMaT", "Western", "Tarkwa"),
        ("University of Education Winneba", "UEW", "Central", "Winneba"),
        ("University of Health and Allied Sciences", "UHAS", "Volta", "Ho"),
        ("Central University", "CU-GH", "Greater Accra", "Accra"),
    ],
    "ZA": [
        ("University of Cape Town", "UCT", "Western Cape", "Cape Town"),
        ("University of the Witwatersrand", "Wits", "Gauteng", "Johannesburg"),
        ("Stellenbosch University", "SU", "Western Cape", "Stellenbosch"),
        ("University of Pretoria", "UP", "Gauteng", "Pretoria"),
        ("University of KwaZulu-Natal", "UKZN", "KZN", "Durban"),
        ("Rhodes University", "Rhodes", "Eastern Cape", "Makhanda"),
        ("University of Johannesburg", "UJ", "Gauteng", "Johannesburg"),
        ("North-West University", "NWU", "North West", "Potchefstroom"),
        ("University of the Free State", "UFS", "Free State", "Bloemfontein"),
        ("Nelson Mandela University", "NMU", "Eastern Cape", "Gqeberha"),
    ],
    "IN": [
        ("IIT Bombay", "IITB", "Maharashtra", "Mumbai"),
        ("IIT Delhi", "IITD", "Delhi", "New Delhi"),
        ("IIT Madras", "IITM", "Tamil Nadu", "Chennai"),
        ("IIT Kanpur", "IITK", "Uttar Pradesh", "Kanpur"),
        ("IISc Bangalore", "IISc", "Karnataka", "Bangalore"),
        ("Delhi University", "DU", "Delhi", "New Delhi"),
        ("JNU", "JNU", "Delhi", "New Delhi"),
        ("University of Mumbai", "MU", "Maharashtra", "Mumbai"),
        ("Anna University", "AU-IN", "Tamil Nadu", "Chennai"),
        ("BITS Pilani", "BITS", "Rajasthan", "Pilani"),
    ],
    "DE": [
        ("TU Munich", "TUM", "Bavaria", "Munich"),
        ("LMU Munich", "LMU", "Bavaria", "Munich"),
        ("Heidelberg University", "Heidelberg", "BW", "Heidelberg"),
        ("Humboldt University", "HU", "Berlin", "Berlin"),
        ("Free University Berlin", "FU", "Berlin", "Berlin"),
        ("RWTH Aachen", "RWTH", "NRW", "Aachen"),
        ("University of Freiburg", "Freiburg", "BW", "Freiburg"),
        ("TU Berlin", "TUB", "Berlin", "Berlin"),
        ("University of Goettingen", "Goettingen", "Lower Saxony", "Goettingen"),
        ("University of Bonn", "Bonn", "NRW", "Bonn"),
    ],
    "KE": [
        ("University of Nairobi", "UoN", "Nairobi", "Nairobi"),
        ("Kenyatta University", "KU", "Nairobi", "Nairobi"),
        ("Moi University", "MU-KE", "Rift Valley", "Eldoret"),
        ("JKUAT", "JKUAT", "Kiambu", "Juja"),
        ("Strathmore University", "Strathmore", "Nairobi", "Nairobi"),
        ("Egerton University", "Egerton", "Nakuru", "Njoro"),
        ("Maseno University", "Maseno", "Kisumu", "Maseno"),
        ("KCA University", "KCA", "Nairobi", "Nairobi"),
        ("Daystar University", "Daystar", "Nairobi", "Nairobi"),
        ("Mount Kenya University", "MKU", "Kiambu", "Thika"),
    ],
}

@router.post("/seed")
async def seed_schools(
    country: str = "US",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403)

    data = GLOBAL_SCHOOLS.get(country.upper(), [])
    if not data:
        available = list(GLOBAL_SCHOOLS.keys())
        raise HTTPException(status_code=400, detail=f"No seed data for '{country}'. Available: {', '.join(available)}")

    added = 0
    skipped = 0
    for name, short, state, city in data:
        existing = await db.execute(
            select(School).where(func.lower(School.name) == name.lower(), School.country == country.upper())
        )
        if existing.scalar_one_or_none():
            skipped += 1
            continue
        school = School(name=name, short_name=short, state=state, city=city, type="university", country=country.upper())
        db.add(school)
        added += 1

    await db.flush()
    total = (await db.execute(select(func.count(School.id)).where(School.country == country.upper()))).scalar() or 0
    return {
        "message": f"Seeded {added} schools for {country.upper()} ({skipped} already existed)",
        "added": added, "skipped": skipped, "totalForCountry": total,
        "availableCountries": list(GLOBAL_SCHOOLS.keys()),
    }

@router.get("/seed/available")
async def seed_available():
    return {
        "countries": {k: len(v) for k, v in GLOBAL_SCHOOLS.items()},
        "total": sum(len(v) for v in GLOBAL_SCHOOLS.values()),
    }
