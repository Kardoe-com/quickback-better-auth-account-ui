import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import authClient from "@/auth/authClient";
import { getStorageApiUrl } from "@/config/runtime";

interface AvatarUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentImage?: string;
    userId: string;
    onSuccess?: (newImageUrl: string | null) => void;
}

type Area = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function AvatarUploadDialog({ isOpen, onClose, currentImage, userId, onSuccess }: AvatarUploadDialogProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB");
            return;
        }

        setError("");
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No 2d context");
        }

        // Set canvas size to match cropped area
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw the cropped image
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // Convert to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Canvas is empty"));
                        return;
                    }
                    resolve(blob);
                },
                "image/jpeg",
                0.9
            );
        });
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsUploading(true);
        setError("");

        try {
            // Get the cropped image blob
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            // Generate a unique filename
            const filename = `avatar-${Date.now()}.jpg`;

            // Upload to storage API
            // The bucket "avatars" should be configured with readScope=public, writeScope=user
            const uploadResponse = await fetch(
                getStorageApiUrl(`/object/avatars/${userId}/${filename}`),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "image/jpeg",
                    },
                    credentials: "include",
                    body: croppedBlob,
                }
            );

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}));
                if (uploadResponse.status === 404 && errorData.error === "Bucket not found") {
                    throw new Error("Avatar storage is not configured. Please contact support.");
                }
                throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`);
            }

            const uploadResult = await uploadResponse.json();

            // Get the public URL for the file
            // For public buckets, the URL is: https://files.<domain>/public/{orgId}/avatars/{path}
            // We'll get the URL from the API
            const urlResponse = await fetch(getStorageApiUrl('/url'), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ key: uploadResult.key }),
            });

            let avatarUrl: string;
            if (urlResponse.ok) {
                const urlData = await urlResponse.json();
                avatarUrl = urlData.url;
            } else {
                // Fallback: construct URL from key
                // This assumes FILES_URL env var is set or we can derive it
                avatarUrl = getStorageApiUrl(`/object/avatars/${userId}/${filename}`);
            }

            // Update user profile with the new avatar URL
            const updateResult = await authClient.updateUser({ image: avatarUrl });

            if (updateResult.error) {
                throw new Error(updateResult.error.message || "Failed to update profile");
            }

            // Force session refresh to get updated user data
            try {
                await authClient.getSession({ query: { disableCookieCache: true } });
            } catch (sessionError) {
                console.warn("Failed to refresh session:", sessionError);
            }

            // Notify parent of success with new URL
            onSuccess?.(avatarUrl);
            handleClose();
        } catch (err) {
            console.error("Error uploading avatar:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onClose();
    };

    const handleRemove = async () => {
        setIsUploading(true);
        setError("");

        try {
            // Update user profile to remove avatar using Better Auth
            const updateResult = await authClient.updateUser({ image: null });

            if (updateResult.error) {
                throw new Error(updateResult.error.message || "Failed to remove avatar");
            }

            // Force session refresh to get updated user data
            try {
                await authClient.getSession({ query: { disableCookieCache: true } });
            } catch (sessionError) {
                console.warn("Failed to refresh session:", sessionError);
            }

            // Notify parent of success with null (removed)
            onSuccess?.(null);
            handleClose();
        } catch (err) {
            console.error("Error removing avatar:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload Avatar</DialogTitle>
                    <DialogDescription>
                        Upload a new profile picture. You can crop it to fit.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!imageSrc ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
                            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">
                                Select an image file
                            </p>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="avatar-upload"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Choose File
                            </Button>
                        </div>
                    ) : (
                        <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                    )}

                    {imageSrc && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Zoom</label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {currentImage && (
                        <Button
                            variant="destructive"
                            onClick={handleRemove}
                            disabled={isUploading}
                            className="w-full sm:w-auto"
                        >
                            Remove Avatar
                        </Button>
                    )}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isUploading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        {imageSrc && (
                            <Button
                                onClick={handleSave}
                                disabled={isUploading || !croppedAreaPixels}
                                className="flex-1"
                            >
                                {isUploading ? "Uploading..." : "Save"}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
