import mongoose from 'mongoose';
const { Schema } = mongoose;

const profileSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    name: String,
    age: String,
    gender: String,
    comments: [{ body: String, date: Date }],
    createdDate: { type: Date, default: Date.now },
});

export default mongoose.model('mydbconnection', profileSchema)