'use server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dbConnect from "./database";
import portfolioModel, { IPortfolio } from "../models/portfolio";
import { redis } from "./redis-client";
import { Purpose} from "../features/portfolio/portfolioSlice";

const expTime=Number(process.env.REDIS_EX_TIME!);


const maxFileSize = 1024 * 1024 * 5; // 5 MB

// Create the S3 client
const s3 = new S3Client({
    region: "auto",
    endpoint:process.env.R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Get a signed URL for uploading an image to S3
export async function getSignedURL(Key: string, oldUrl: string | undefined, imageType: string, size: number, routeName: string,type:Purpose) {
    if (oldUrl) {
       const result= await deleteImage(oldUrl,type,routeName);
       if(result?.success==false) return '';
    }

    if (size > maxFileSize) return '';
    if (!imageType.includes('image/')) return '';

    const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key,
        ContentType: imageType,
        ContentLength: size,
        // ChecksumSHA256: checksum,
        Metadata: {
            user: routeName,
        },
    });

    try {
        const signedUrl = await getSignedUrl(s3, putObjectCommand, { expiresIn: 60 });
        return signedUrl;
    } catch (error) {
        console.error("Error getting signed URL:", error);
        return '';
    }
}

// Delete an image by its URL and update the database
export async function deleteImage(url: string, deleteType: Purpose,routeName:string|null=null,projectIndex:number|null=null): Promise<{ success: boolean; message: string }> {
    // const key = url.split('.com/')[1];
    const key = new URL(url).pathname.slice(1);
    
    try {
        await dbConnect();
        const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
      });
     
        await s3.send(deleteObjectCommand);
      if(deleteType===Purpose.ProfileImage &&routeName){

        await portfolioModel.findOneAndUpdate(
            { 'personalInfo.profilePicture': url },
            { $set: { 'personalInfo.profilePicture': '' } }
        );
        const portfolio=await redis.get(routeName) as  IPortfolio|null;
        if(portfolio){
            const updatedPortfolio=(portfolio);
            updatedPortfolio.personalInfo.profilePicture='';
            await redis.setex(routeName,expTime,JSON.stringify(updatedPortfolio))
        }
        return { success: true, message: "Image has been deleted." };
       }else if(deleteType===Purpose.ProjectImage){


        return { success: true, message: "Image has been deleted." };   
      }else{
        return { success: false, message: "Invalid delete type." };
      }

        // Optionally return the result of the deletion
    } catch (error) {
        console.error("Error deleting image:", error);
        return { success: false, message: "Failed to delete image." };
    }
}
