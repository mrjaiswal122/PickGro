import { Experience } from "@/components/portfolio/Experience";
import { ProjectData } from "@/components/portfolio/Projects";
import { getSignedURL, deleteImage } from "@/lib/s3";
import { createAppAsyncThunk } from "@/store/hooks";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Update } from "@/types/Update";
import axios from "axios";
import { Types } from "mongoose";
import { setToastMsgRedux } from "../toastMsg/toastMsgSlice";
import {Skill} from "@/components/portfolio/Skills";


export enum DeleteImageType {
  ProfileImage = "deleting profile image",
  ProjectImage = "deleting projects image",
}
export enum PortfolioStatus {
  Ideal = "ideal",
  Failed = "failed",
  Succeeded = "succeeded",
  Pending = "pending",
}
//purpose for calling imageUpload thunk
export enum Purpose {
  ProfileImage = "for uploading profile picture",
  ProjectImage = "for uploading project image",
  Empty = "image is not provided",
}
export enum Upload {
  ProfileImage = "updating profile image in the DB",
  Project = "adding project to the DB",
  WorkExperience = "adding experience to the DB",
  Education = "adding education to the DB",
  Skills = "adding skill to the Db",
  Certificate = "adding Certification to the DB",
  Publication = "adding blogs to the DB",
  Language = "adding language",
  Interest = "adding hobbies",
  Resume = "updating resume",
  Summary = "updating Bio",
  Hero = "update hero section",
}
export enum Delete {
  Project = "Deleting particular project from the DB",
  WorkExperience = "Deleting particular work experience from the DB",
  Education = "Deleting particular education from the DB",
  Skills = "Deleting particular skill from the DB",
  Certificate = "Deleting particular certification from the DB",
  Publication = "Deleting particular publication from the DB",
}
// Define the Portfolio type
export type Portfolio = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  personalInfo: {
    fullName: string;
    profilePicture?: string;
    title: string;
    location?: string;
    email: string;
    phone?: string;
    socialLinks?: {
      linkedIn?: string;
      instagram?: string;
      youtube?: string;
      facebook?: string;
      github?: string;
      twitter?: string;
    };
  };
  summary?: {
    aboutMe?: string;
    careerObjective?: string;
  };
  skills?: Array<{
    category?: string;
    skills?: string[];
    proficiency?: string;
  }>;
  experience?: Array<{
    jobTitle: string;
    companyName: string;
    companyLogo?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    responsibilities?: string;
  }>;
  education?: Array<{
    degree: string;
    institutionName: string;
    institutionLogo?: string;
    location?: string;
    startDate?: Date;
    endDate?: Date;
    achievements?: string;
  }>;
  projects?: Array<{
    title: string;
    description: string;
    technologies: string[];
    projectUrl?: string;
    githubUrl?: string;
    image?: string;
  }>;
  certifications?: Array<{
    title: string;
    organization: string;
    dateEarned: Date;
    certificateUrl?: string;
  }>;
  publications?: Array<{
    title: string;
    datePublished?: Date;
    description?: string;
    url?: string;
  }>;
  awards?: Array<{
    title: string;
    organization: string;
    dateReceived?: Date;
    description?: string;
  }>;
  languages: string[];
  interests?: string[];
  testimonials?: Array<{
    name?: string;
    jobTitle?: string;
    company?: string;
    contactInfo?: string;
    testimonialText?: string;
  }>;
  contact?: {
    email?: string;
    message?: string;
  };
  resume?: {
    fileUrl?: string;
  };
  routeName: string;
  isOwner: boolean;
  status: PortfolioStatus;
  createdAt?: Date;
  updatedAt?: Date;
};
interface UploadImageArgs {
  routename: string;
  image: Blob | undefined | string; // Base64-encoded image string
  key: string;
  oldUrl: string | undefined;
  type: Purpose;
}
interface UpdateProjectArgs {
  data: ProjectData;
  routename: string;
  pathname: string;
  oldProjectImage: string | undefined;
}
export type UpdateProjectReturnType = {
  sendData: {
    title: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    projectUrl?: string;
    image?: string;
  };
  success: boolean;
};
export type UpdateExistingProjectArgs = {
  data: ProjectData;
  index: number;
  routeName: string;
  key: string;
  oldUrl: string | undefined;
};
export type UpdateExsitingProjectReturnType = {
  success: boolean;
  project: {
    title: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    projectUrl?: string;
    image?: string;
  };
  index: number;
};

export type UpdateExperienceArgs = {
  data: Experience;
  index: number;
  routeName: string;
};
export type UpdateExperienceReturnType = {
  success: Boolean;
  data: Experience | null;
  index: number;
};

type UpdateSkillArgs={
  data:Skill;
  index:number;
  routeName:string
}
type UpdateSkillReturnType={
  success:boolean;
  data:Skill|null;
  index:number;
}

export type UpdateProfileArgs = {
  data: {
    personalInfo: Portfolio["personalInfo"];
    summary: Portfolio["summary"];
  };
  routeName: string;
};
export type UpdateProfileReturnType = {
  success: boolean;
  data: UpdateProfileArgs["data"];
};

// Initial state
const initialState: Portfolio = {
  user: "" as any, // Placeholder, replace with actual Types.ObjectId type if needed
  personalInfo: {
    fullName: "",
    title: "",
    email: "",
  },
  summary: {
    aboutMe: "",
  },
  experience: [],
  languages: [],
  routeName: "",
  status: PortfolioStatus.Ideal,
  isOwner: false,
  _id: "" as any,
};

//async thunk
const updateProjectAsync = createAppAsyncThunk<
  UpdateProjectReturnType,
  UpdateProjectArgs
>(
  "portfolio/updateProjectAsync",
  async (
    { data, routename, pathname, oldProjectImage },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const result = await dispatch(
        uploadImageAsync({
          routename,
          image: data.image,
          key: pathname,
          oldUrl: oldProjectImage,
          type: Purpose.ProjectImage,
        })
      );
      const url = (result.payload as { url: string }).url;

      const sendData = {
        title: data.title,
        description: data.description,
        technologies: data.technologies,
        githubUrl: data.githubUrl,
        projectUrl: data.projectUrl,
        image: url,
      };
      const formData = new FormData();
      formData.append("routename", routename);
      formData.append("data", JSON.stringify(sendData));
      formData.append("uploadType", Upload.Project);

      //calling the api for updation
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("updateProjectAsync", response);

      //sending data to extraReducers
      if (response.data.success) {
        dispatch(
          setToastMsgRedux({ msg: "Successfully Added Project ", type: "msg" })
        );
        return { sendData, success: true };
      } else {
        dispatch(
          setToastMsgRedux({ msg: "Error Adding Project !! ", type: "error" })
        );
        return { success: false, sendData };
      }
    } catch (e) {
      dispatch(
        setToastMsgRedux({ msg: "Error Adding Project !! ", type: "error" })
      );
      return rejectWithValue("Failed to update project.");
    }
  }
);
const updateExistingProjectAsync = createAppAsyncThunk<
  UpdateExsitingProjectReturnType,
  UpdateExistingProjectArgs
>(
  "portfolio/updateExistingProjectAsync",
  async ({ data, index, routeName, key, oldUrl }, { dispatch }) => {
    let imageUrl = oldUrl;

    try {
      // Handle image replacement cases
      if (data.image instanceof File) {
        const result = await dispatch(
          uploadImageAsync({
            routename: routeName,
            image: data.image,
            key,
            oldUrl,
            type: Purpose.ProjectImage,
          })
        );
        imageUrl = (result.payload as { url: string }).url || "";
      } else if (!data.image && oldUrl) {
        const deleteResult = await deleteImage(oldUrl, Purpose.ProjectImage);
        if (!deleteResult.success) throw new Error("Failed to delete image");
        imageUrl = ""; // No image after deletion
      }

      // Prepare project data for API
      const projectData = {
        title: data.title,
        description: data.description,
        technologies: data.technologies,
        githubUrl: data.githubUrl,
        projectUrl: data.projectUrl,
        image: imageUrl,
      };

      // Submit updated data to API
      const formData = new FormData();
      formData.append("routeName", routeName);
      formData.append("data", JSON.stringify(projectData));
      formData.append("updateType", Update.Project);
      formData.append("index", JSON.stringify(index));

      const response = await axios.post("/api/update", formData);
      if (response.data.success) {
        dispatch(
          setToastMsgRedux({
            msg: "Updated Project Successfully ",
            type: "msg",
          })
        );
        return { success: true, project: projectData, index };
      }
    } catch (error) {
      dispatch(
        setToastMsgRedux({ msg: "Error Updating Project !! ", type: "error" })
      );
      return {
        success: false,
        project: {
          title: "",
          description: "",
          technologies: [],
          githubUrl: "",
          projectUrl: "",
          image: "",
        },
        index,
      };
    }

    // Fallback response if update fails
    dispatch(
      setToastMsgRedux({ msg: "Error Updating Project !! ", type: "error" })
    );
    return {
      success: false,
      project: {
        title: "",
        description: "",
        technologies: [],
        githubUrl: "",
        projectUrl: "",
        image: "",
      },
      index,
    };
  }
);

const uploadImageAsync = createAppAsyncThunk<
  { type: Purpose; url: string },
  UploadImageArgs
>(
  "portfolio/uploadImageAsync",
  async ({ routename, image, key, oldUrl, type }: UploadImageArgs) => {
    if (typeof image === "string") {
      return { type: Purpose.Empty, url: image };
    }
    try {
      //uploading to aws
      //if image is undefined then it will get out of the thunk
      if (!image) return { type: Purpose.Empty, url: "" };
      // const computeSHA256 = async (image: Blob) => {
      //   const buffer = await image.arrayBuffer();
      //   const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      //   const hashArray = Array.from(new Uint8Array(hashBuffer));
      //   const hashHex = hashArray
      //     .map((b) => b.toString(16).padStart(2, "0"))
      //     .join("");
      //   return hashHex;
      // };

      // const checksum = await computeSHA256(image);
      const signedUrl = await getSignedURL(
        key,
        oldUrl,
        image.type,
        image.size,
        // checksum,
        routename,
        type
      );
      await axios.put(signedUrl, image, {
        headers: {
          "Content-Type": image?.type,
        },
      });

      // Prepare the form data to update the imageUrl in the DB
      if (type == Purpose.ProfileImage) {
        const formData = new FormData();
        formData.append("routename", routename);
        formData.append("data", signedUrl.split("?")[0]);
        formData.append("uploadType", Upload.ProfileImage);

        //calling the api for updation
        const response = await axios.post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else if (type == Purpose.ProjectImage) {
        // set this for project Image upload
        console.log("Project Image upload");
      }

      // Return the uploaded image URL
      return { type: type, url: signedUrl.split("?")[0] };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Image upload failed");
    }
  }
);
const deleteParticularObjectAsync = createAppAsyncThunk(
  "portfolio/deleteParticularObject",
  async (
    {
      from,
      index,
      routeName,
    }: { from: Delete; index: number; routeName: string },
    { dispatch }
  ) => {
    try {
      const res = await axios.delete(
        `/api/delete?type=${from}&index=${index}&routeName=${routeName}`
      );
      if (res.data.success == true) {
        let type: string;
        switch (from) {
          case Delete.Project:
            type = "Project";
            break;
          case Delete.WorkExperience:
            type = "Experience";
            break;
          case Delete.Skills:
            type = "Skills";
            break;
          default:
            type = "";
        }
        dispatch(
          setToastMsgRedux({ msg: `${type} Deleted Successfully`, type: "msg" })
        );
        return { sucess: true, type: from, index };
      }
      dispatch(setToastMsgRedux({ msg: "Error Deleting !!", type: "error" }));
      return { sucess: false, type: from, index };
    } catch (error) {
      dispatch(setToastMsgRedux({ msg: "Error Deleting !!", type: "error" }));
    }
  }
);
const deleteImageAsync = createAppAsyncThunk(
  "portfolio/deleteImageAsync",
  async (
    {
      url,
      deleteType,
      routeName,
    }: { url: string; deleteType: Purpose; routeName: string },
    { dispatch, rejectWithValue }
  ) => {
    const res = await deleteImage(url, deleteType, routeName);
    if (res?.success == true) {
      dispatch(
        setToastMsgRedux({
          msg: "Profile Picture Deleted Successfully",
          type: "msg",
        })
      );
      return "";
    } else {
      dispatch(
        setToastMsgRedux({
          msg: "Error Deleting Profile Picture",
          type: "error",
        })
      );
      return rejectWithValue("Image was not deleted");
    }
  }
);
const updateExperienceAsync = createAppAsyncThunk<
  UpdateExperienceReturnType,
  UpdateExperienceArgs
>(
  "portfolio/updateExperienceAsync",
  async (
    { data, index, routeName }: UpdateExperienceArgs,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("routeName", routeName);
      formData.append("data", JSON.stringify(data));
      formData.append("updateType", Update.WorkExperience);
      formData.append("index", JSON.stringify(index));
      const response = await axios.post("/api/update", formData);

      if (response.data.success) {
        dispatch(
          setToastMsgRedux({
            msg: "Updated Experience Successfully",
            type: "msg",
           })
        );
        return { success: true, data: data, index };
      } else {
        dispatch(
         setToastMsgRedux({
            msg: "Error Updating Experience !! ",
            type: "error",
          })
        );
        return rejectWithValue({ success: false, data: null, index });
      }
    } catch (error) {
      dispatch(
        setToastMsgRedux({
          msg: "Error Updating Experience !! ",
          type: "error",
        })
      );
      rejectWithValue({ success: false, data: null, index });
    }
    //fallback return and message
    dispatch(
      setToastMsgRedux({ msg: "Error Updating Experience !! ", type: "error" })
    );
    return { success: false, data: null, index };
  }
);
const updateSkillAsync=createAppAsyncThunk<UpdateSkillReturnType,UpdateSkillArgs>(
 "portfolio/updateSkillAsync",
  async (
    { data, index, routeName }: UpdateSkillArgs,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("routeName", routeName);
      formData.append("data", JSON.stringify(data));
      formData.append("updateType", Update.Skills);
      formData.append("index", JSON.stringify(index));
      const response = await axios.post("/api/update", formData);

      if (response.data.success) {
        dispatch(
          setToastMsgRedux({
            msg: "Updated Skills Successfully",
            type: "msg",
           })
        );
        return { success: true, data: data, index };
      } else {
        dispatch(
         setToastMsgRedux({
            msg: "Error Updating Skills !! ",
            type: "error",
          })
        );
        return rejectWithValue({ success: false, data: null, index });
      }
    } catch (error) {
      dispatch(
        setToastMsgRedux({
          msg: "Error Updating Skills !! ",
          type: "error",
        })
      );
      rejectWithValue({ success: false, data: null, index });
    }
    //fallback return and message
    dispatch(
      setToastMsgRedux({ msg: "Error Updating Skills !! ", type: "error" })
    );
    return { success: false, data: null, index };
  }
)
const updateProfileAsync = createAppAsyncThunk<
  UpdateProfileReturnType,
  UpdateProfileArgs
>(
  "portfolio/updateProfileAsync",
  async (
    { data, routeName }: UpdateProfileArgs,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("routeName", routeName);
      formData.append("data", JSON.stringify(data));
      formData.append("updateType", Update.Profile);
      const response = await axios.post("/api/update", formData);
      console.log("Response from api/update", response);

      if (response.data.success) {
        dispatch(
          setToastMsgRedux({ msg: "Profile updated successfully", type: "msg" })
        );
        return { success: true, data: data };
      } else {
        dispatch(
          setToastMsgRedux({
            msg: "Error updating profile else !!",
            type: "error",
          })
        );
        return rejectWithValue({ success: false, data: null });
      }
    } catch (error) {
      console.log("Error occured in updateExperienceAsync->", error);
      dispatch(
        setToastMsgRedux({ msg: "Error updating profile", type: "error" })
      );
      return rejectWithValue({ success: false, data: null });
    }
    // return {success:false,data:null}
  }
);
const updateRouteNameAsync = createAppAsyncThunk(
  "portfolio/updateRouteNameAsync",
  async (
    { changedRouteName }: { changedRouteName: string },
    { getState, dispatch }
  ) => {
    const { userSlice} = getState();
    const formData = new FormData();
    formData.append("updateType", Update.RouteName);
    formData.append("routeName", userSlice.username!);
    formData.append("data", changedRouteName);

    try {
      const response = await axios.post("/api/update", formData);
      console.log("From updateRouteNameAsync:->", response);

      if (response.data.success) {
        dispatch(
          setToastMsgRedux({ msg: "RouteName has been Updated", type: "msg" })
        );
        return { redirect: true }; // Ensure correct type here
      } else {
        dispatch(
          setToastMsgRedux({
            msg: "Error updating Route Name !!",
            type: "error",
          })
        );
        return { redirect: false }; // Ensure correct type here
      }
    } catch (error) {
      dispatch(
        setToastMsgRedux({ msg: "Error updating Route Name !!", type: "error" })
      );
      return { redirect: false }; // Return consistent type in error cases
    }
  }
);

// Create a slice
const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    // Update the entire portfolio
    updatePortfolio: (state, action: PayloadAction<Partial<Portfolio>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    updateIsOwner: (
      state,
      action: PayloadAction<Partial<Portfolio["isOwner"]>>
    ) => {
      state.isOwner = action.payload;
    },
    updateStatus: (
      state,
      action: PayloadAction<Partial<Portfolio["status"]>>
    ) => {
      state.status = action.payload;
    },
    updateRouteName: (
      state,
      action: PayloadAction<Partial<Portfolio["routeName"]>>
    ) => {
      state.routeName = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(uploadImageAsync.fulfilled, (state, action) => {
        state.status = PortfolioStatus.Succeeded;
        // Add any fetched posts to the array
        if (action.payload.type == Purpose.Empty) {
          return;
        } else if (action.payload.type == Purpose.ProfileImage) {
          state.personalInfo.profilePicture = action.payload.url;
        } else if (action.payload.type == Purpose.ProjectImage) {
          return;
        }
      })

      .addCase(deleteImageAsync.fulfilled, (state, action) => {
        state.status = PortfolioStatus.Succeeded;
        // Add any fetched posts to the array
        state.personalInfo.profilePicture = action.payload;
      })

      .addCase(updateProjectAsync.fulfilled, (state, action) => {
        state.status = PortfolioStatus.Succeeded;
        // Add any fetched posts to the array
        if (action.payload.success)
          state.projects?.push(action.payload.sendData);
        else return;
      })

      .addCase(deleteParticularObjectAsync.fulfilled, (state, action) => {
        state.status = PortfolioStatus.Succeeded;
        if (action?.payload?.type == Delete.Project) {
          state.projects?.splice(action?.payload?.index, 1);
        } else if (action?.payload?.type == Delete.WorkExperience) {
          state.experience?.splice(action?.payload?.index, 1);
        }else if (action?.payload?.type == Delete.Skills) {
          state.skills?.splice(action?.payload?.index, 1);
        }
       
      })

      .addCase(updateExistingProjectAsync.fulfilled, (state, action) => {
        state.status = PortfolioStatus.Succeeded;
        // Add any fetched posts to the array
        if (action.payload.success === true && state.projects) {
          const { index, project } = action.payload;
          if (index >= 0 && index < state.projects.length) {
            state.projects[index] = project;
          }
        }
        return;
      })

      .addCase(updateExperienceAsync.fulfilled, (state, action) => {
        state.status = PortfolioStatus.Succeeded;
        if (
          action.payload.success &&
          action.payload.index >= 0 &&
          action.payload.data
        ) {
          if (!state.experience) {
            state.experience = [];
          }

          state.experience[action.payload.index] = action.payload.data;
        }
      })
      .addCase(updateSkillAsync.fulfilled, (state, action) => {
        state.status = PortfolioStatus.Succeeded;
        if (
          action.payload.success &&
          action.payload.index >= 0 &&
          action.payload.data
        ) {
          if (!state.skills) {
            state.skills = [];
          }

          state.skills[action.payload.index] = action.payload.data;
        }
      })
      

      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.personalInfo = action.payload.data.personalInfo;
          state.summary = action.payload.data.summary;
        }
      });
  },
});

// Export actions
export const { updatePortfolio, updateIsOwner, updateStatus } =
  portfolioSlice.actions;
export {
  uploadImageAsync,
  deleteImageAsync,
  updateProjectAsync,
  deleteParticularObjectAsync,
  updateExistingProjectAsync,
  updateExperienceAsync,
  updateProfileAsync,
  updateRouteNameAsync,
  updateSkillAsync
};
// Export the reducer
export default portfolioSlice.reducer;
