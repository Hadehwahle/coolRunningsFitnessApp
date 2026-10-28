import mongoose from 'mongoose';

const runSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    distance: {
      type: Number,
      required: [true, 'Distance is required'],
      min: [0.1, 'Distance must be at least 0.1 km'],
      max: [500, 'Distance cannot exceed 500 km'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 second'],
    },
    pace: {
      type: Number,
      required: true,
    },
    calories: {
      type: Number,
      min: 0,
    },
    weather: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'hot', 'cold', 'windy', ''],
      default: '',
    },
    shoes: {
      type: String,
      maxlength: [100, 'Shoes description cannot exceed 100 characters'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    elevationGain: {
      type: Number,
      min: 0,
      default: 0,
    },
    route: {
      type: {
        type: String,
        enum: ['LineString'],
      },
      coordinates: [[Number]], // Array of [longitude, latitude] pairs
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
runSchema.index({ userId: 1, startTime: -1 });
runSchema.index({ userId: 1, createdAt: -1 });
runSchema.index({ createdAt: -1 });

// Pace is always derived from distance and duration (min/km)
runSchema.pre('validate', function (next) {
  if (this.distance && this.duration) {
    this.pace = (this.duration / 60) / this.distance;
  }
  next();
});

const Run = mongoose.model('Run', runSchema);

export default Run;
