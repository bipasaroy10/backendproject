import { asyncHandler } from "../utils/asyncHandler.js"; 
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens =async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return{accessToken, refreshToken}
    
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refrsh tokens")
    }
}

const registerUser = asyncHandler( async (req, res)=> {
   const {fullName, email, password, username }= req.body
    // console.log("email: ",email);

   if (
    [fullName,email,password,username].some((field) =>
    field?.trim() === "")
   ) {
    throw new ApiError(400,"All fields are required")
   }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]

       
    })
    
 if (existedUser) {
        throw new ApiError(409,"email or username already exists")    
        }
    

// console.log(req.files);

const avatarLocalPath = req.files?.avatar[0]?.path;  
const coverImageLocalPath = req.files?.coverImage[0]?.path;
console.log(avatarLocalPath);


if (!avatarLocalPath) {
    throw new ApiError(404,"avatar is required")
}

const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);
// console.log(avatar);

if (!avatar) {
    throw new ApiError(404,"avatar is required")
}

const user = await User.create({
    fullName,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
})

const finduser = await User.findById(user._id).select(
    "-password -refreshToken"
) 

if (!finduser) {
    throw new ApiError(500 ,"somthing went wrong while registering the user")
}

return res.status(201).json(
    new ApiResponse(200, finduser, "user successfully registered")
)


})



const loginUser = asyncHandler( async(req,res)=> {

    const {email, username, password} = req.body

    if (!email || !username) {
        throw new Error(400, "user or email is required");
        
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if (!isPasswordvalid) {
          throw new ApiError(404, "password is invalid")
    }

    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(useDeferredValue._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options ={
        httpOnly: true,
        secure: true
    }

    return res 
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

export{
    registerUser,
    loginUser,
    logoutUser
}