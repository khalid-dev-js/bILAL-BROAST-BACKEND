const streamifier = require('streamifier')
const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function uploadBufferToCloudinary(buffer, folder = 'bilalbroast') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' })
    const result = await uploadBufferToCloudinary(req.file.buffer, req.body.folder || 'bilal-broast/products')
    res.json({ success: true, data: { url: result.secure_url, publicId: result.public_id, raw: result } })
  } catch (err) { next(err) }
}

async function deleteImage(req, res, next) {
  try {
    const { publicId } = req.body
    if (!publicId) return res.status(400).json({ success: false, message: 'publicId required' })
    const result = await cloudinary.uploader.destroy(publicId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

module.exports = { uploadImage, deleteImage }
