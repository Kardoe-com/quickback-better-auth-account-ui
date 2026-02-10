import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import authClient from "@/auth/authClient";
import { getStorageApiUrl } from "@/config/runtime";

interface OrgLogoUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentLogo?: string | null;
    organizationId: string;
    onSuccess?: (newLogoUrl: string | null) => void;
}

type Area = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function OrgLogoUploadDialog({ isOpen, onClose, currentLogo, organizationId, onSuccess }: OrgLogoUploadDialogProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

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

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

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
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const filename = `logo-${Date.now()}.jpg`;

            const uploadResponse = await fetch(
                getStorageApiUrl(`/object/org-logos/${organizationId}/${filename}`),
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
                    throw new Error("Logo storage is not configured. Please contact support.");
                }
                throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`);
            }

            const uploadResult = await uploadResponse.json();

            const urlResponse = await fetch(getStorageApiUrl('/url'), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ key: uploadResult.key }),
            });

            let logoUrl: string;
            if (urlResponse.ok) {
                const urlData = await urlResponse.json();
                logoUrl = urlData.url;
            } else {
                logoUrl = getStorageApiUrl(`/object/org-logos/${organizationId}/${filename}`);
            }

            const { error: updateError } = await authClient.organization.update({
                data: { logo: logoUrl },
            });

            if (updateError) {
                throw new Error(updateError.message || "Failed to update organization");
            }

            onSuccess?.(logoUrl);
            handleClose();
        } catch (err) {
            console.error("Error uploading logo:", err);
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
            const { error: updateError } = await authClient.organization.update({
                data: { logo: undefined },
            });

            if (updateError) {
                throw new Error(updateError.message || "Failed to remove logo");
            }

            onSuccess?.(null);
            handleClose();
        } catch (err) {
            console.error("Error removing logo:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload Logo</DialogTitle>
                    <DialogDescription>
                        Upload a new logo for your organization. You can crop it to fit.
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
                                id="logo-upload"
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
                    {currentLogo && (
                        <Button
                            variant="destructive"
                            onClick={handleRemove}
                            disabled={isUploading}
                            className="w-full sm:w-auto"
                        >
                            Remove Logo
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
