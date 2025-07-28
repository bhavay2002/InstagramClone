import { Router } from "express";
import multer from "multer";
import { uploadToCloudinary } from "../utils/cloudinary";
import { isAuthenticated } from "../middleware/isAuthenticated";
import asyncHandler from "express-async-handler";
import type { SessionRequest } from "../types/SessionRequest";
import type { Response } from "express";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

// Upload endpoint for post media
router.post("/media", 
  isAuthenticated,
  upload.array('files', 10), // Allow up to 10 files
  asyncHandler(async (req: SessionRequest, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    try {
      const uploadPromises = files.map(file => 
        uploadToCloudinary(file.buffer, file.originalname)
      );
      
      const results = await Promise.all(uploadPromises);
      
      const mediaUrls = results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        width: result.width,
        height: result.height,
      }));

      res.json({ media: mediaUrls });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Upload failed" });
    }
  })
);

export default router;