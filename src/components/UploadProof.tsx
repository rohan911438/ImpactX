import { useState, useCallback } from "react";
import { Upload, Image, Video, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const UploadProof = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = useCallback(async (uploadFile: File) => {
    setIsUploading(true);
    setIsVerified(false);

    // Simulate AI verification
    await new Promise(resolve => setTimeout(resolve, 3000));

    setIsUploading(false);
    setIsVerified(true);

    toast({
      title: "Verification Complete! 🎉",
      description: "Your impact has been verified. NFT minting in progress...",
    });

    // Simulate NFT minting
    setTimeout(() => {
      toast({
        title: "NFT Minted! ✨",
        description: "Your Impact NFT has been minted to your wallet",
      });
    }, 2000);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('video/'))) {
      setFile(droppedFile);
      handleUpload(droppedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or video file",
        variant: "destructive",
      });
    }
  }, [toast, handleUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleUpload(selectedFile);
    }
  }, [handleUpload]);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            Upload Your <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Proof</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share evidence of your positive impact and get it verified by AI
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <Card
            className={`p-8 glass-effect transition-all duration-300 ${
              isDragging ? 'border-primary shadow-lg scale-105' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!file ? (
              <div className="text-center py-12">
                <Upload className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2">Drop your proof here</h3>
                <p className="text-muted-foreground mb-6">
                  or click to browse files
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="hero" className="cursor-pointer">
                    Choose File
                  </Button>
                </label>
                <div className="flex justify-center gap-6 mt-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    <span>Images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Videos</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                {isUploading ? (
                  <>
                    <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
                    <h3 className="text-2xl font-bold mb-2">AI Verifying...</h3>
                    <p className="text-muted-foreground">
                      Analyzing your proof for authenticity and impact
                    </p>
                  </>
                ) : isVerified ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-6" />
                    <h3 className="text-2xl font-bold mb-2">Verified! 🎉</h3>
                    <p className="text-muted-foreground mb-4">
                      Your impact has been confirmed
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {file.name}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => {
                        setFile(null);
                        setIsVerified(false);
                      }}
                    >
                      Upload Another
                    </Button>
                  </>
                ) : null}
              </div>
            )}
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <Card className="p-4 glass-effect text-center">
              <div className="text-2xl font-bold text-primary">15.2K</div>
              <div className="text-sm text-muted-foreground">Verified Proofs</div>
            </Card>
            <Card className="p-4 glass-effect text-center">
              <div className="text-2xl font-bold text-secondary">98.7%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </Card>
            <Card className="p-4 glass-effect text-center">
              <div className="text-2xl font-bold text-accent">24h</div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
