import fs from 'fs';

import axios from 'axios';
import FormData from 'form-data';
import { IncomingForm } from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();

    // Parse the incoming request
    const { files } = await new Promise<{ fields: any; files: any }>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve({ fields, files });
        });
      }
    );

    let { file } = files; // Assuming the field name is 'file'
    if (Array.isArray(file)) {
      file = file[0];
    }

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read the file from the temporary path
    const fileStream = fs.createReadStream(file.filepath);

    // Create a new FormData instance for the backend request
    const formData = new FormData();
    formData.append('file', fileStream, {
      filename: file.originalFilename || 'upload.jpg',
      contentType: file.mimetype || 'image/jpeg',
    });

    // Get the headers from the original request (specifically Authorization)
    const token = req.headers.authorization;
    const headers = {
      ...formData.getHeaders(),
      ...(token ? { Authorization: token } : {}),
    };

    // Send to external API
    const response = await axios.post(
      'https://proyecto-bd-juan.onrender.com/api/Upload/image',
      formData,
      {
        headers,
      }
    );

    // Return the response from the external API
    return res.status(200).send(response.data);
  } catch (error: any) {
    console.error('Proxy Upload Error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Error uploading file',
      error: error.response?.data || error.message,
    });
  }
};

export default handler;
