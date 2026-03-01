from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

# Fix imports for consistent style
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings

router = APIRouter()

# Simple In-Memory "Database" for Dev
system_users = {
    settings.ADMIN_USERNAME: {
        "username": settings.ADMIN_USERNAME,
        "full_name": "Stratum Admin",
        "email": "admin@stratum.net",
        "hashed_password": get_password_hash(settings.ADMIN_PASSWORD),
        "disabled": False,
        "roles": ["ADMIN", "GOVERNOR"]
    }
}

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = system_users.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "roles": user["roles"]},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: str = Depends(lambda: "admin")):
    # Dummy placeholder for current user
    return {"username": current_user, "roles": ["ADMIN"]}
