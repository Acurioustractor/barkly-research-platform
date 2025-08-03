-- Cross-Community Trend Analysis Database Schema
-- This schema supports comprehensive trend analysis across multiple communities
-- including pattern recognition, service effectiveness analysis, and emerging needs detection

-- Cross-community trend analyses table
CREATE TABLE IF NOT EXISTS cross_community_trend_analyses (
    id TEXT PRIMARY KEY,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('community_health', 'service_effectiveness', 'emerging_needs', 'cultural_patterns', 'resource_allocation')),
    timeframe TEXT NOT NULL CHECK (timeframe IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    communities TEXT[] NOT NULL DEFAULT '{}',
    trend_data JSONB NOT NULL DEFAULT '[]',
    insights JSONB NOT NULL DEFAULT '[]',
    patterns JSONB NOT NULL DEFAULT '[]',
    recommendations JSONB NOT NULL DEFAULT '[]',
    confidence DECIMAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    next_analysis TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service effectiveness analyses table
CREATE TABLE IF NOT EXISTS service_effectiveness_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL,
    analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    overall_effectiveness DECIMAL NOT NULL CHECK (overall_effectiveness >= 0 AND overall_effectiveness <= 100),
    community_variations JSONB NOT NULL DEFAULT '[]',
    best_practices JSONB NOT NULL DEFAULT '[]',
    improvement_opportunities JSONB NOT NULL DEFAULT '[]',
    methodology TEXT,
    data_sources TEXT[] DEFAULT '{}',
    limitations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emerging needs analyses table
CREATE TABLE IF NOT EXISTS emerging_needs_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    need_category TEXT NOT NULL,
    urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    prevalence DECIMAL NOT NULL CHECK (prevalence >= 0 AND prevalence <= 100),
    trend_direction TEXT NOT NULL CHECK (trend_direction IN ('increasing', 'stable', 'decreasing')),
    affected_communities JSONB NOT NULL DEFAULT '[]',
    root_causes TEXT[] DEFAULT '{}',
    potential_solutions TEXT[] DEFAULT '{}',
    resource_requirements TEXT[] DEFAULT '{}',
    detection_method TEXT,
    confidence_level DECIMAL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    first_detected TIMESTAMP WITH TIME ZONE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pattern recognition results table
CREATE TABLE IF NOT EXISTS pattern_recognition_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('seasonal', 'geographic', 'demographic', 'cultural', 'economic', 'service_related')),
    pattern_name TEXT NOT NULL,
    pattern_description TEXT NOT NULL,
    communities TEXT[] NOT NULL DEFAULT '{}',
    frequency TEXT NOT NULL CHECK (frequency IN ('recurring', 'emerging', 'declining')),
    strength DECIMAL NOT NULL CHECK (strength >= 0 AND strength <= 1),
    predictability DECIMAL NOT NULL CHECK (predictability >= 0 AND predictability <= 1),
    factors JSONB NOT NULL DEFAULT '[]',
    examples JSONB NOT NULL DEFAULT '[]',
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected')),
    validation_notes TEXT,
    lookback_period_months INTEGER NOT NULL,
    algorithm_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cross-community correlations table
CREATE TABLE IF NOT EXISTS cross_community_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_1 TEXT NOT NULL,
    metric_2 TEXT NOT NULL,
    correlation_coefficient DECIMAL NOT NULL CHECK (correlation_coefficient >= -1 AND correlation_coefficient <= 1),
    significance_level DECIMAL CHECK (significance_level >= 0 AND significance_level <= 1),
    sample_size INTEGER NOT NULL,
    communities_included TEXT[] NOT NULL DEFAULT '{}',
    analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    correlation_type TEXT CHECK (correlation_type IN ('pearson', 'spearman', 'kendall')),
    interpretation TEXT,
    cultural_factors TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trend prediction models table
CREATE TABLE IF NOT EXISTS trend_prediction_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('linear_regression', 'time_series', 'machine_learning', 'statistical')),
    target_metric TEXT NOT NULL,
    input_features TEXT[] NOT NULL DEFAULT '{}',
    model_parameters JSONB DEFAULT '{}',
    training_data_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    training_data_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    accuracy_score DECIMAL CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    validation_method TEXT,
    communities_trained_on TEXT[] DEFAULT '{}',
    cultural_adjustments JSONB DEFAULT '{}',
    model_status TEXT DEFAULT 'active' CHECK (model_status IN ('active', 'deprecated', 'testing')),
    last_retrained TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community comparison metrics table
CREATE TABLE IF NOT EXISTS community_comparison_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    comparison_date TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_category TEXT NOT NULL,
    percentile_rank DECIMAL CHECK (percentile_rank >= 0 AND percentile_rank <= 100),
    z_score DECIMAL,
    comparison_group TEXT, -- e.g., 'similar_size', 'same_region', 'all_communities'
    cultural_context_adjustment DECIMAL DEFAULT 0,
    data_source TEXT,
    calculation_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trend analysis alerts table
CREATE TABLE IF NOT EXISTS trend_analysis_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('significant_change', 'anomaly_detected', 'pattern_broken', 'threshold_exceeded', 'correlation_changed')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_communities TEXT[] DEFAULT '{}',
    related_analysis_id TEXT REFERENCES cross_community_trend_analyses(id),
    metric_involved TEXT,
    threshold_value DECIMAL,
    actual_value DECIMAL,
    deviation_percentage DECIMAL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    auto_generated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cross_community_trend_analyses_type ON cross_community_trend_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_cross_community_trend_analyses_timeframe ON cross_community_trend_analyses(timeframe);
CREATE INDEX IF NOT EXISTS idx_cross_community_trend_analyses_generated_at ON cross_community_trend_analyses(generated_at);
CREATE INDEX IF NOT EXISTS idx_cross_community_trend_analyses_communities ON cross_community_trend_analyses USING GIN(communities);

CREATE INDEX IF NOT EXISTS idx_service_effectiveness_analyses_service_type ON service_effectiveness_analyses(service_type);
CREATE INDEX IF NOT EXISTS idx_service_effectiveness_analyses_period ON service_effectiveness_analyses(analysis_period_start, analysis_period_end);

CREATE INDEX IF NOT EXISTS idx_emerging_needs_analyses_category ON emerging_needs_analyses(need_category);
CREATE INDEX IF NOT EXISTS idx_emerging_needs_analyses_urgency ON emerging_needs_analyses(urgency);
CREATE INDEX IF NOT EXISTS idx_emerging_needs_analyses_trend_direction ON emerging_needs_analyses(trend_direction);

CREATE INDEX IF NOT EXISTS idx_pattern_recognition_results_type ON pattern_recognition_results(pattern_type);
CREATE INDEX IF NOT EXISTS idx_pattern_recognition_results_frequency ON pattern_recognition_results(frequency);
CREATE INDEX IF NOT EXISTS idx_pattern_recognition_results_strength ON pattern_recognition_results(strength);
CREATE INDEX IF NOT EXISTS idx_pattern_recognition_results_communities ON pattern_recognition_results USING GIN(communities);

CREATE INDEX IF NOT EXISTS idx_cross_community_correlations_metrics ON cross_community_correlations(metric_1, metric_2);
CREATE INDEX IF NOT EXISTS idx_cross_community_correlations_coefficient ON cross_community_correlations(correlation_coefficient);
CREATE INDEX IF NOT EXISTS idx_cross_community_correlations_period ON cross_community_correlations(analysis_period_start, analysis_period_end);

CREATE INDEX IF NOT EXISTS idx_trend_prediction_models_target_metric ON trend_prediction_models(target_metric);
CREATE INDEX IF NOT EXISTS idx_trend_prediction_models_status ON trend_prediction_models(model_status);
CREATE INDEX IF NOT EXISTS idx_trend_prediction_models_accuracy ON trend_prediction_models(accuracy_score);

CREATE INDEX IF NOT EXISTS idx_community_comparison_metrics_community_id ON community_comparison_metrics(community_id);
CREATE INDEX IF NOT EXISTS idx_community_comparison_metrics_date ON community_comparison_metrics(comparison_date);
CREATE INDEX IF NOT EXISTS idx_community_comparison_metrics_name ON community_comparison_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_community_comparison_metrics_category ON community_comparison_metrics(metric_category);

CREATE INDEX IF NOT EXISTS idx_trend_analysis_alerts_type ON trend_analysis_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_alerts_severity ON trend_analysis_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_alerts_detected_at ON trend_analysis_alerts(detected_at);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_alerts_acknowledged ON trend_analysis_alerts(acknowledged);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pattern_recognition_results_updated_at 
    BEFORE UPDATE ON pattern_recognition_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trend_prediction_models_updated_at 
    BEFORE UPDATE ON trend_prediction_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate community percentile rankings
CREATE OR REPLACE FUNCTION calculate_community_percentile_rankings(
    p_metric_name TEXT,
    p_comparison_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
    community_id UUID,
    metric_value DECIMAL,
    percentile_rank DECIMAL,
    z_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH metric_stats AS (
        SELECT 
            AVG(ccm.metric_value) as mean_value,
            STDDEV(ccm.metric_value) as std_dev
        FROM community_comparison_metrics ccm
        WHERE ccm.metric_name = p_metric_name
        AND ccm.comparison_date = p_comparison_date
    ),
    ranked_communities AS (
        SELECT 
            ccm.community_id,
            ccm.metric_value,
            PERCENT_RANK() OVER (ORDER BY ccm.metric_value) * 100 as percentile_rank,
            CASE 
                WHEN ms.std_dev > 0 THEN (ccm.metric_value - ms.mean_value) / ms.std_dev
                ELSE 0
            END as z_score
        FROM community_comparison_metrics ccm
        CROSS JOIN metric_stats ms
        WHERE ccm.metric_name = p_metric_name
        AND ccm.comparison_date = p_comparison_date
    )
    SELECT 
        rc.community_id,
        rc.metric_value,
        rc.percentile_rank,
        rc.z_score
    FROM ranked_communities rc
    ORDER BY rc.percentile_rank DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to detect trend anomalies
CREATE OR REPLACE FUNCTION detect_trend_anomalies(
    p_metric_name TEXT,
    p_lookback_days INTEGER DEFAULT 30,
    p_threshold_std_devs DECIMAL DEFAULT 2.0
)
RETURNS TABLE (
    community_id UUID,
    community_name TEXT,
    current_value DECIMAL,
    expected_value DECIMAL,
    deviation_std_devs DECIMAL,
    anomaly_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH historical_stats AS (
        SELECT 
            ccm.community_id,
            AVG(ccm.metric_value) as mean_value,
            STDDEV(ccm.metric_value) as std_dev,
            COUNT(*) as data_points
        FROM community_comparison_metrics ccm
        WHERE ccm.metric_name = p_metric_name
        AND ccm.comparison_date >= CURRENT_TIMESTAMP - (p_lookback_days || ' days')::INTERVAL
        AND ccm.comparison_date < CURRENT_TIMESTAMP - INTERVAL '1 day'
        GROUP BY ccm.community_id
        HAVING COUNT(*) >= 5 -- Minimum data points for reliable statistics
    ),
    current_values AS (
        SELECT 
            ccm.community_id,
            ccm.metric_value as current_value
        FROM community_comparison_metrics ccm
        WHERE ccm.metric_name = p_metric_name
        AND ccm.comparison_date >= CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    anomalies AS (
        SELECT 
            cv.community_id,
            c.name as community_name,
            cv.current_value,
            hs.mean_value as expected_value,
            CASE 
                WHEN hs.std_dev > 0 THEN ABS(cv.current_value - hs.mean_value) / hs.std_dev
                ELSE 0
            END as deviation_std_devs,
            CASE 
                WHEN cv.current_value > hs.mean_value + (p_threshold_std_devs * hs.std_dev) THEN 'high_anomaly'
                WHEN cv.current_value < hs.mean_value - (p_threshold_std_devs * hs.std_dev) THEN 'low_anomaly'
                ELSE 'normal'
            END as anomaly_type
        FROM current_values cv
        JOIN historical_stats hs ON cv.community_id = hs.community_id
        JOIN communities c ON cv.community_id = c.id
        WHERE hs.std_dev > 0
    )
    SELECT 
        a.community_id,
        a.community_name,
        a.current_value,
        a.expected_value,
        a.deviation_std_devs,
        a.anomaly_type
    FROM anomalies a
    WHERE a.anomaly_type != 'normal'
    ORDER BY a.deviation_std_devs DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify cross-community correlations
CREATE OR REPLACE FUNCTION identify_cross_community_correlations(
    p_metric_1 TEXT,
    p_metric_2 TEXT,
    p_analysis_period_days INTEGER DEFAULT 90,
    p_min_correlation DECIMAL DEFAULT 0.5
)
RETURNS TABLE (
    correlation_coefficient DECIMAL,
    significance_level DECIMAL,
    sample_size INTEGER,
    interpretation TEXT
) AS $$
DECLARE
    v_correlation DECIMAL;
    v_sample_size INTEGER;
    v_significance DECIMAL;
    v_interpretation TEXT;
BEGIN
    -- Calculate correlation using PostgreSQL's built-in functions
    WITH metric_pairs AS (
        SELECT 
            m1.community_id,
            m1.metric_value as value_1,
            m2.metric_value as value_2
        FROM community_comparison_metrics m1
        JOIN community_comparison_metrics m2 ON m1.community_id = m2.community_id 
            AND m1.comparison_date = m2.comparison_date
        WHERE m1.metric_name = p_metric_1
        AND m2.metric_name = p_metric_2
        AND m1.comparison_date >= CURRENT_TIMESTAMP - (p_analysis_period_days || ' days')::INTERVAL
    ),
    correlation_calc AS (
        SELECT 
            COUNT(*) as n,
            CORR(value_1, value_2) as correlation
        FROM metric_pairs
        WHERE value_1 IS NOT NULL AND value_2 IS NOT NULL
    )
    SELECT 
        cc.correlation,
        cc.n,
        -- Simplified significance calculation (would need more complex stats in production)
        CASE 
            WHEN cc.n > 30 AND ABS(cc.correlation) > 0.3 THEN 0.05
            WHEN cc.n > 10 AND ABS(cc.correlation) > 0.6 THEN 0.05
            ELSE 0.1
        END as sig_level
    INTO v_correlation, v_sample_size, v_significance
    FROM correlation_calc cc;

    -- Generate interpretation
    v_interpretation := CASE 
        WHEN ABS(v_correlation) >= 0.8 THEN 'Very strong correlation'
        WHEN ABS(v_correlation) >= 0.6 THEN 'Strong correlation'
        WHEN ABS(v_correlation) >= 0.4 THEN 'Moderate correlation'
        WHEN ABS(v_correlation) >= 0.2 THEN 'Weak correlation'
        ELSE 'No significant correlation'
    END;

    IF v_correlation < 0 THEN
        v_interpretation := 'Negative ' || LOWER(v_interpretation);
    ELSE
        v_interpretation := 'Positive ' || LOWER(v_interpretation);
    END IF;

    RETURN QUERY SELECT v_correlation, v_significance, v_sample_size, v_interpretation;
END;
$$ LANGUAGE plpgsql;

-- Function to generate trend analysis summary
CREATE OR REPLACE FUNCTION generate_trend_analysis_summary(
    p_analysis_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    metric_name TEXT,
    total_analyses INTEGER,
    avg_confidence DECIMAL,
    patterns_identified INTEGER,
    alerts_generated INTEGER,
    top_insight TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Cross-Community Health' as metric_name,
        COUNT(*)::INTEGER as total_analyses,
        AVG(cta.confidence) as avg_confidence,
        SUM(jsonb_array_length(cta.patterns))::INTEGER as patterns_identified,
        (SELECT COUNT(*)::INTEGER FROM trend_analysis_alerts WHERE detected_at >= CURRENT_TIMESTAMP - (p_analysis_period_days || ' days')::INTERVAL) as alerts_generated,
        'Community health trends show positive correlation with engagement levels' as top_insight
    FROM cross_community_trend_analyses cta
    WHERE cta.generated_at >= CURRENT_TIMESTAMP - (p_analysis_period_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Insert sample trend analysis data
INSERT INTO cross_community_trend_analyses (
    id, analysis_type, timeframe, communities, trend_data, insights, patterns, 
    recommendations, confidence, generated_at, next_analysis
) VALUES (
    'trend-analysis-health-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT,
    'community_health',
    'monthly',
    (SELECT array_agg(id::TEXT) FROM communities LIMIT 5),
    jsonb_build_array(
        jsonb_build_object(
            'communityId', (SELECT id FROM communities LIMIT 1),
            'communityName', (SELECT name FROM communities LIMIT 1),
            'timestamp', CURRENT_TIMESTAMP,
            'metrics', jsonb_build_object(
                'healthScore', 75.5,
                'communityEngagement', 68.2,
                'serviceUtilization', 82.1
            ),
            'culturalContext', 'indigenous',
            'population', 2500
        )
    ),
    jsonb_build_array(
        jsonb_build_object(
            'id', 'insight-1',
            'type', 'positive_trend',
            'title', 'Improving Community Health Scores',
            'description', 'Community health scores have improved by 12% over the past month',
            'strength', 'strong',
            'confidence', 0.85,
            'implications', jsonb_build_array('Continued improvement expected', 'Resource allocation effective')
        )
    ),
    jsonb_build_array(
        jsonb_build_object(
            'id', 'pattern-1',
            'patternType', 'cultural',
            'name', 'Cultural Event Participation Pattern',
            'description', 'Communities with regular cultural events show 20% higher engagement',
            'strength', 0.78,
            'frequency', 'recurring'
        )
    ),
    jsonb_build_array(
        jsonb_build_object(
            'id', 'rec-1',
            'priority', 'medium',
            'type', 'capacity_building',
            'title', 'Expand Cultural Programming',
            'description', 'Increase cultural event programming in communities showing lower engagement'
        )
    ),
    0.82,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 month'
);

-- Insert sample service effectiveness analysis
INSERT INTO service_effectiveness_analyses (
    service_type, analysis_period_start, analysis_period_end, overall_effectiveness,
    community_variations, best_practices, improvement_opportunities
) VALUES (
    'health_services',
    CURRENT_TIMESTAMP - INTERVAL '3 months',
    CURRENT_TIMESTAMP,
    78.5,
    jsonb_build_array(
        jsonb_build_object(
            'communityId', (SELECT id FROM communities LIMIT 1),
            'effectiveness', 85.2,
            'factors', jsonb_build_array('Strong community health worker program', 'Good transportation access')
        )
    ),
    jsonb_build_array(
        jsonb_build_object(
            'communityId', (SELECT id FROM communities LIMIT 1),
            'practice', 'Peer health educator program',
            'impact', 0.15,
            'replicability', 0.9
        )
    ),
    jsonb_build_array(
        jsonb_build_object(
            'area', 'Service accessibility',
            'communities', (SELECT array_agg(id::TEXT) FROM communities LIMIT 3),
            'potentialImpact', 0.12,
            'recommendations', jsonb_build_array('Improve transportation', 'Extend service hours')
        )
    )
);

-- Insert sample emerging needs analysis
INSERT INTO emerging_needs_analyses (
    need_category, urgency, prevalence, trend_direction, affected_communities,
    root_causes, potential_solutions, resource_requirements, first_detected
) VALUES (
    'mental_health_support',
    'high',
    65.0,
    'increasing',
    jsonb_build_array(
        jsonb_build_object(
            'communityId', (SELECT id FROM communities LIMIT 1),
            'severity', 8.5,
            'specificNeeds', jsonb_build_array('Youth counseling', 'Crisis intervention'),
            'culturalFactors', jsonb_build_array('Traditional healing integration needed')
        )
    ),
    ARRAY['Increased social isolation', 'Economic pressures', 'Limited access to services'],
    ARRAY['Mobile mental health units', 'Peer support programs', 'Traditional healing integration'],
    ARRAY['Trained counselors', 'Transportation', 'Cultural liaisons'],
    CURRENT_TIMESTAMP - INTERVAL '2 weeks'
);

-- Insert sample pattern recognition results
INSERT INTO pattern_recognition_results (
    pattern_type, pattern_name, pattern_description, communities, frequency,
    strength, predictability, factors, examples, lookback_period_months
) VALUES (
    'seasonal',
    'Winter Health Decline Pattern',
    'Community health indicators consistently decline during winter months',
    (SELECT array_agg(id::TEXT) FROM communities WHERE geographic_region = 'northern' LIMIT 3),
    'recurring',
    0.73,
    0.85,
    jsonb_build_array(
        jsonb_build_object(
            'factor', 'Seasonal Affective Disorder',
            'influence', -0.4,
            'description', 'Reduced daylight affects mental health',
            'evidence', jsonb_build_array('40% increase in depression symptoms', 'Reduced community participation')
        )
    ),
    jsonb_build_array(
        jsonb_build_object(
            'communityId', (SELECT id FROM communities LIMIT 1),
            'communityName', (SELECT name FROM communities LIMIT 1),
            'example', 'Health score dropped from 78 to 65 between October and February',
            'timestamp', CURRENT_TIMESTAMP - INTERVAL '3 months',
            'outcome', 'Implemented light therapy program'
        )
    ),
    12
);

COMMENT ON TABLE cross_community_trend_analyses IS 'Comprehensive trend analyses across multiple communities';
COMMENT ON TABLE service_effectiveness_analyses IS 'Analysis of service effectiveness across communities';
COMMENT ON TABLE emerging_needs_analyses IS 'Detection and analysis of emerging community needs';
COMMENT ON TABLE pattern_recognition_results IS 'Results from automated pattern recognition algorithms';
COMMENT ON TABLE cross_community_correlations IS 'Statistical correlations between community metrics';
COMMENT ON TABLE trend_prediction_models IS 'Machine learning models for trend prediction';
COMMENT ON TABLE community_comparison_metrics IS 'Standardized metrics for cross-community comparison';
COMMENT ON TABLE trend_analysis_alerts IS 'Automated alerts from trend analysis systems';