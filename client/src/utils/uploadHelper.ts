import { supabase as defaultSupabase } from '../supabaseClient';

/**
 * Uploads a file to a specific bucket and folder in Supabase Storage.
 * @param file The file object to upload.
 * @param bucket The name of the storage bucket (default: 'uploads').
 * @param folder An optional folder path within the bucket.
 * @param supabaseClient Optional Supabase client instance (for isolated sessions).
 * @returns The public URL of the uploaded file.
 */
export const uploadFile = async (
    file: File, 
    bucket: string = 'uploads', 
    folder: string = '', 
    supabaseClient: any = defaultSupabase
): Promise<string> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { error: uploadError } = await supabaseClient.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabaseClient.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};
