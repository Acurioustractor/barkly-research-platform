-- Multimedia Processing Database Schema
-- This schema supports audio and video processing pipeline integration

-- Media Processing Jobs Table
-- Tracks processing jobs for multimedia content
CREATE TABLE media_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('audio', 'video', 'image')),
    original_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_steps JSONB NOT NULL DEFAULT '[]',
    outputs JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    error TEXT,
    priority INTEGER DEFAULT 5, -- 1-10, higher is more urgent
    assigned_worker VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Story Analysis Table
-- Stores AI analysis results for stories
CREATE TABLE story_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('content', 'sentiment', 'themes', 'cultural', 'accessibility', 'multimedia')),
    results JSONB NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, analysis_type, version)
);

-- Media Transcripts Table
-- Stores transcripts from audio and video processing
CREATE TABLE media_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    processing_job_id UUID NOT NULL REFERENCES media_processing_jobs(id) ON DELETE CASCADE,
    transcript_text TEXT NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    word_timestamps JSONB, -- Array of {word, start, end, confidence}
    speaker_segments JSONB, -- Array of {speaker_id, start, end, text}
    is_human_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Media Captions Table
-- Stores captions/subtitles for video content
CREATE TABLE media_captions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    processing_job_id UUID NOT NULL REFERENCES media_processing_jobs(id) ON DELETE CASCADE,
    caption_format VARCHAR(10) NOT NULL DEFAULT 'srt' CHECK (caption_format IN ('srt', 'vtt', 'ass')),
    caption_content TEXT NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    is_auto_generated BOOLEAN DEFAULT true,
    is_human_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Media Thumbnails Table
-- Stores generated thumbnails for video content
CREATE TABLE media_thumbnails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    processing_job_id UUID NOT NULL REFERENCES media_processing_jobs(id) ON DELETE CASCADE,
    thumbnail_url TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    timestamp_seconds DECIMAL(10,3), -- Position in video where thumbnail was taken
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Content Analysis Results Table
-- Stores detailed AI analysis results
CREATE TABLE content_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    processing_job_id UUID NOT NULL REFERENCES media_processing_jobs(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN (
        'themes', 'sentiment', 'cultural_safety', 'traditional_knowledge', 
        'speaker_detection', 'scene_detection', 'object_detection', 'text_extraction'
    )),
    results JSONB NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Processing Queue Table
-- Manages processing queue and worker assignments
CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES media_processing_jobs(id) ON DELETE CASCADE,
    queue_name VARCHAR(50) NOT NULL DEFAULT 'default',
    priority INTEGER NOT NULL DEFAULT 5,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_by VARCHAR(255),
    locked_at TIMESTAMP WITH TIME ZONE,
    lock_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Processing Workers Table
-- Tracks available processing workers
CREATE TABLE processing_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_name VARCHAR(255) NOT NULL UNIQUE,
    worker_type VARCHAR(50) NOT NULL CHECK (worker_type IN ('audio', 'video', 'image', 'general')),
    status VARCHAR(20) NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'offline', 'error')),
    capabilities TEXT[] DEFAULT '{}', -- Array of supported processing steps
    current_job_id UUID REFERENCES media_processing_jobs(id),
    max_concurrent_jobs INTEGER DEFAULT 1,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Processing Metrics Table
-- Tracks processing performance and statistics
CREATE TABLE processing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES media_processing_jobs(id) ON DELETE CASCADE,
    worker_name VARCHAR(255),
    step_name VARCHAR(100) NOT NULL,
    processing_time_seconds INTEGER NOT NULL,
    memory_usage_mb INTEGER,
    cpu_usage_percent DECIMAL(5,2),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Accessibility Features Table
-- Tracks accessibility features for multimedia content
CREATE TABLE accessibility_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL CHECK (feature_type IN (
        'transcript', 'captions', 'audio_description', 'sign_language', 'alt_text', 'high_contrast'
    )),
    feature_url TEXT,
    feature_content TEXT,
    language VARCHAR(10) DEFAULT 'en',
    is_available BOOLEAN DEFAULT true,
    quality_score DECIMAL(3,2),
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_media_processing_jobs_story ON media_processing_jobs(story_id);
CREATE INDEX idx_media_processing_jobs_status ON media_processing_jobs(status);
CREATE INDEX idx_media_processing_jobs_media_type ON media_processing_jobs(media_type);
CREATE INDEX idx_media_processing_jobs_priority ON media_processing_jobs(priority DESC);
CREATE INDEX idx_media_processing_jobs_created ON media_processing_jobs(created_at);

CREATE INDEX idx_story_analysis_story ON story_analysis(story_id);
CREATE INDEX idx_story_analysis_type ON story_analysis(analysis_type);
CREATE INDEX idx_story_analysis_confidence ON story_analysis(confidence);

CREATE INDEX idx_media_transcripts_story ON media_transcripts(story_id);
CREATE INDEX idx_media_transcripts_job ON media_transcripts(processing_job_id);
CREATE INDEX idx_media_transcripts_language ON media_transcripts(language);
CREATE INDEX idx_media_transcripts_verified ON media_transcripts(is_human_verified);

CREATE INDEX idx_media_captions_story ON media_captions(story_id);
CREATE INDEX idx_media_captions_job ON media_captions(processing_job_id);
CREATE INDEX idx_media_captions_language ON media_captions(language);
CREATE INDEX idx_media_captions_format ON media_captions(caption_format);

CREATE INDEX idx_media_thumbnails_story ON media_thumbnails(story_id);
CREATE INDEX idx_media_thumbnails_primary ON media_thumbnails(is_primary);

CREATE INDEX idx_content_analysis_story ON content_analysis_results(story_id);
CREATE INDEX idx_content_analysis_job ON content_analysis_results(processing_job_id);
CREATE INDEX idx_content_analysis_type ON content_analysis_results(analysis_type);

CREATE INDEX idx_processing_queue_priority ON processing_queue(priority DESC, created_at);
CREATE INDEX idx_processing_queue_next_attempt ON processing_queue(next_attempt_at);
CREATE INDEX idx_processing_queue_locked ON processing_queue(locked_by, locked_at);

CREATE INDEX idx_processing_workers_status ON processing_workers(status);
CREATE INDEX idx_processing_workers_type ON processing_workers(worker_type);
CREATE INDEX idx_processing_workers_heartbeat ON processing_workers(last_heartbeat);

CREATE INDEX idx_processing_metrics_job ON processing_metrics(job_id);
CREATE INDEX idx_processing_metrics_worker ON processing_metrics(worker_name);
CREATE INDEX idx_processing_metrics_step ON processing_metrics(step_name);
CREATE INDEX idx_processing_metrics_success ON processing_metrics(success);

CREATE INDEX idx_accessibility_features_story ON accessibility_features(story_id);
CREATE INDEX idx_accessibility_features_type ON accessibility_features(feature_type);
CREATE INDEX idx_accessibility_features_available ON accessibility_features(is_available);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_media_processing_jobs_updated_at BEFORE UPDATE ON media_processing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_analysis_updated_at BEFORE UPDATE ON story_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_transcripts_updated_at BEFORE UPDATE ON media_transcripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_captions_updated_at BEFORE UPDATE ON media_captions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_processing_queue_updated_at BEFORE UPDATE ON processing_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_processing_workers_updated_at BEFORE UPDATE ON processing_workers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accessibility_features_updated_at BEFORE UPDATE ON accessibility_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create processing jobs when multimedia stories are submitted
CREATE OR REPLACE FUNCTION create_processing_jobs_for_story()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create processing jobs for multimedia content
    IF NEW.media_type IN ('audio', 'video', 'multimedia') AND NEW.media_urls IS NOT NULL THEN
        -- Create processing jobs for each media file
        -- This would be handled by the application layer in practice
        -- but we can create a placeholder job
        INSERT INTO media_processing_jobs (
            story_id,
            media_type,
            original_url,
            status,
            processing_steps,
            metadata
        ) VALUES (
            NEW.id,
            NEW.media_type,
            'placeholder_url', -- Would be actual media URL
            'pending',
            CASE NEW.media_type
                WHEN 'audio' THEN '[
                    {"name": "metadata_extraction", "status": "pending", "progress": 0},
                    {"name": "transcription", "status": "pending", "progress": 0},
                    {"name": "content_analysis", "status": "pending", "progress": 0},
                    {"name": "cultural_analysis", "status": "pending", "progress": 0}
                ]'::jsonb
                WHEN 'video' THEN '[
                    {"name": "metadata_extraction", "status": "pending", "progress": 0},
                    {"name": "thumbnail_generation", "status": "pending", "progress": 0},
                    {"name": "transcription", "status": "pending", "progress": 0},
                    {"name": "content_analysis", "status": "pending", "progress": 0},
                    {"name": "cultural_analysis", "status": "pending", "progress": 0}
                ]'::jsonb
                ELSE '[]'::jsonb
            END,
            '{}'::jsonb
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_processing_jobs_trigger
    AFTER INSERT ON enhanced_community_stories
    FOR EACH ROW EXECUTE FUNCTION create_processing_jobs_for_story();

-- Function to get processing statistics
CREATE OR REPLACE FUNCTION get_processing_statistics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_jobs BIGINT,
    completed_jobs BIGINT,
    failed_jobs BIGINT,
    processing_jobs BIGINT,
    pending_jobs BIGINT,
    avg_processing_time NUMERIC,
    jobs_by_type JSONB,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH job_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COUNT(*) FILTER (WHERE status = 'processing') as processing,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_time,
            jsonb_object_agg(media_type, type_count) as by_type
        FROM (
            SELECT 
                status,
                started_at,
                completed_at,
                media_type,
                COUNT(*) OVER (PARTITION BY media_type) as type_count
            FROM media_processing_jobs
            WHERE created_at BETWEEN p_start_date AND p_end_date
        ) sub
        GROUP BY ()
    )
    SELECT 
        js.total,
        js.completed,
        js.failed,
        js.processing,
        js.pending,
        COALESCE(js.avg_time, 0),
        js.by_type,
        CASE 
            WHEN js.total > 0 THEN ROUND((js.completed::NUMERIC / js.total::NUMERIC) * 100, 2)
            ELSE 0
        END
    FROM job_stats js;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old processing jobs
CREATE OR REPLACE FUNCTION cleanup_old_processing_jobs(
    p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete completed jobs older than specified days
    DELETE FROM media_processing_jobs
    WHERE status = 'completed'
    AND completed_at < NOW() - (p_days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up failed jobs older than specified days
    DELETE FROM media_processing_jobs
    WHERE status = 'failed'
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to retry failed processing jobs
CREATE OR REPLACE FUNCTION retry_failed_jobs(
    p_max_attempts INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
    retried_count INTEGER;
BEGIN
    -- Reset failed jobs that haven't exceeded max attempts
    UPDATE media_processing_jobs
    SET 
        status = 'pending',
        error = NULL,
        updated_at = NOW()
    WHERE status = 'failed'
    AND (
        SELECT attempts 
        FROM processing_queue pq 
        WHERE pq.job_id = media_processing_jobs.id
    ) < p_max_attempts;
    
    GET DIAGNOSTICS retried_count = ROW_COUNT;
    
    -- Update queue entries
    UPDATE processing_queue
    SET 
        attempts = attempts + 1,
        next_attempt_at = NOW() + (attempts * INTERVAL '5 minutes'),
        updated_at = NOW()
    WHERE job_id IN (
        SELECT id FROM media_processing_jobs 
        WHERE status = 'pending' 
        AND updated_at >= NOW() - INTERVAL '1 minute'
    );
    
    RETURN retried_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for story processing status
CREATE VIEW story_processing_status AS
SELECT 
    s.id as story_id,
    s.title,
    s.media_type,
    s.created_at as story_created_at,
    COUNT(mpj.id) as total_jobs,
    COUNT(mpj.id) FILTER (WHERE mpj.status = 'completed') as completed_jobs,
    COUNT(mpj.id) FILTER (WHERE mpj.status = 'failed') as failed_jobs,
    COUNT(mpj.id) FILTER (WHERE mpj.status = 'processing') as processing_jobs,
    COUNT(mpj.id) FILTER (WHERE mpj.status = 'pending') as pending_jobs,
    CASE 
        WHEN COUNT(mpj.id) = 0 THEN 'no_processing'
        WHEN COUNT(mpj.id) FILTER (WHERE mpj.status = 'failed') > 0 
             AND COUNT(mpj.id) FILTER (WHERE mpj.status = 'completed') = 0 THEN 'failed'
        WHEN COUNT(mpj.id) FILTER (WHERE mpj.status IN ('pending', 'processing')) > 0 THEN 'processing'
        WHEN COUNT(mpj.id) = COUNT(mpj.id) FILTER (WHERE mpj.status = 'completed') THEN 'completed'
        ELSE 'partial'
    END as overall_status,
    CASE 
        WHEN COUNT(mpj.id) = 0 THEN 100
        ELSE ROUND((COUNT(mpj.id) FILTER (WHERE mpj.status = 'completed')::NUMERIC / COUNT(mpj.id)::NUMERIC) * 100)
    END as progress_percentage
FROM enhanced_community_stories s
LEFT JOIN media_processing_jobs mpj ON s.id = mpj.story_id
WHERE s.media_type IN ('audio', 'video', 'multimedia')
GROUP BY s.id, s.title, s.media_type, s.created_at;

-- Insert sample processing workers
INSERT INTO processing_workers (worker_name, worker_type, capabilities) VALUES
('audio-worker-1', 'audio', ARRAY['transcription', 'speaker_detection', 'sentiment_analysis', 'cultural_analysis']),
('video-worker-1', 'video', ARRAY['thumbnail_generation', 'transcription', 'scene_detection', 'caption_generation']),
('image-worker-1', 'image', ARRAY['object_detection', 'text_extraction', 'cultural_sensitivity_check']),
('general-worker-1', 'general', ARRAY['metadata_extraction', 'content_analysis']);

COMMENT ON TABLE media_processing_jobs IS 'Tracks multimedia processing jobs for stories';
COMMENT ON TABLE story_analysis IS 'Stores AI analysis results for stories';
COMMENT ON TABLE media_transcripts IS 'Stores transcripts from audio and video processing';
COMMENT ON TABLE media_captions IS 'Stores captions/subtitles for video content';
COMMENT ON TABLE content_analysis_results IS 'Stores detailed AI analysis results';
COMMENT ON TABLE processing_queue IS 'Manages processing queue and worker assignments';
COMMENT ON TABLE accessibility_features IS 'Tracks accessibility features for multimedia content';