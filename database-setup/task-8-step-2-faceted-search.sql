-- =====================================================
-- TASK 8 - STEP 2: Faceted Search with Filters and Aggregations
-- Advanced Filtering and Aggregation for Search Results
-- =====================================================

-- Create search facets configuration table
CREATE TABLE IF NOT EXISTS search_facets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Facet Information
    facet_name TEXT NOT NULL UNIQUE,
    facet_display_name TEXT NOT NULL,
    facet_type TEXT NOT NULL
        CHECK (facet_type IN ('categorical', 'range', 'date_range', 'boolean', 'hierarchical', 'cultural')),
    
    -- Data Source
    source_table TEXT NOT NULL,
    source_column TEXT NOT NULL,
    aggregation_function TEXT DEFAULT 'count'
        CHECK (aggregation_function IN ('count', 'sum', 'avg', 'min', 'max', 'array_agg')),
    
    -- Cultural Context
    cultural_facet BOOLEAN DEFAULT false,
    requires_cultural_approval BOOLEAN DEFAULT false,
    cultural_sensitivity_levels TEXT[] DEFAULT '{}',
    
    -- Display Configuration
    display_order INTEGER DEFAULT 0,
    max_values INTEGER DEFAULT 20,
    show_counts BOOLEAN DEFAULT true,
    collapsible BOOLEAN DEFAULT true,
    
    -- System Fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default search facets
INSERT INTO search_facets (facet_name, facet_display_name, facet_type, source_table, source_column, cultural_facet, display_order) VALUES
('document_type', 'Document Type', 'categorical', 'documents', 'document_type', false, 1),
('cultural_sensitivity', 'Cultural Sensitivity', 'cultural', 'documents', 'cultural_sensitivity_level', true, 2),
('language', 'Language', 'categorical', 'documents', 'language', false, 3),
('created_date', 'Created Date', 'date_range', 'documents', 'created_at', false, 4),
('file_size', 'File Size', 'range', 'documents', 'file_size', false, 5),
('processing_status', 'Processing Status', 'categorical', 'documents', 'processing_status', false, 6),
('has_cultural_content', 'Has Cultural Content', 'boolean', 'documents', 'requires_elder_approval', true, 7),
('theme_category', 'Theme Category', 'categorical', 'document_themes', 'theme_category', false, 8),
('quote_type', 'Quote Type', 'categorical', 'document_quotes', 'quote_type', false, 9),
('traditional_knowledge', 'Traditional Knowledge', 'boolean', 'documents', 'traditional_knowledge_category', true, 10);

-- Create function to get facet values for search results
CREATE OR REPLACE FUNCTION get_search_facets(
    p_query TEXT DEFAULT NULL,
    p_community_id UUID DEFAULT NULL,
    p_search_config TEXT DEFAULT 'standard_english',
    p_cultural_sensitivity_filter TEXT DEFAULT 'community_safe',
    p_document_types TEXT[] DEFAULT NULL,
    p_existing_filters JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    facet_results JSONB := '{}';
    facet_record RECORD;
    facet_values JSONB;
    search_config_name TEXT;
    ts_query tsquery;
    cultural_filter TEXT;
    base_where_clause TEXT;
BEGIN
    -- Get search configuration
    SELECT ts_config_name INTO search_config_name 
    FROM search_configurations 
    WHERE config_name = p_search_config AND is_active = true;
    
    IF search_config_name IS NULL THEN
        search_config_name := 'english';
    END IF;
    
    -- Build cultural sensitivity filter
    CASE p_cultural_sensitivity_filter
        WHEN 'public_only' THEN cultural_filter := 'public';
        WHEN 'community_safe' THEN cultural_filter := 'public,community';
        WHEN 'all_accessible' THEN cultural_filter := 'public,community,restricted';
        ELSE cultural_filter := 'public,community,restricted,sacred,ceremonial';
    END CASE;
    
    -- Build base WHERE clause for document filtering
    base_where_clause := '1=1';
    
    IF p_query IS NOT NULL THEN
        ts_query := plainto_tsquery(search_config_name, p_query);
        base_where_clause := base_where_clause || ' AND (
            to_tsvector(''' || search_config_name || ''', coalesce(title, '''')) ||
            to_tsvector(''' || search_config_name || ''', coalesce(description, '''')) ||
            to_tsvector(''' || search_config_name || ''', coalesce(text_content, ''''))
        ) @@ ''' || ts_query::TEXT || '''';
    END IF;
    
    IF p_community_id IS NOT NULL THEN
        base_where_clause := base_where_clause || ' AND community_id = ''' || p_community_id || '''';
    END IF;
    
    base_where_clause := base_where_clause || ' AND cultural_sensitivity_level = ANY(string_to_array(''' || cultural_filter || ''', '',''))';
    
    -- Process each active facet
    FOR facet_record IN 
        SELECT * FROM search_facets 
        WHERE is_active = true 
        ORDER BY display_order
    LOOP
        -- Generate facet values based on facet type
        CASE facet_record.facet_type
            WHEN 'categorical' THEN
                EXECUTE format('
                    SELECT jsonb_object_agg(value, count) 
                    FROM (
                        SELECT %I as value, count(*) as count
                        FROM %I 
                        WHERE %s
                        GROUP BY %I
                        ORDER BY count DESC, %I
                        LIMIT %s
                    ) facet_data',
                    facet_record.source_column,
                    facet_record.source_table,
                    base_where_clause,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.max_values
                ) INTO facet_values;
                
            WHEN 'boolean' THEN
                EXECUTE format('
                    SELECT jsonb_object_agg(
                        CASE WHEN %I THEN ''true'' ELSE ''false'' END, 
                        count
                    ) 
                    FROM (
                        SELECT %I, count(*) as count
                        FROM %I 
                        WHERE %s
                        GROUP BY %I
                    ) facet_data',
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_table,
                    base_where_clause,
                    facet_record.source_column
                ) INTO facet_values;
                
            WHEN 'date_range' THEN
                EXECUTE format('
                    SELECT jsonb_build_object(
                        ''min_date'', min(%I),
                        ''max_date'', max(%I),
                        ''ranges'', jsonb_object_agg(date_range, count)
                    )
                    FROM (
                        SELECT 
                            CASE 
                                WHEN %I >= NOW() - INTERVAL ''1 day'' THEN ''last_24h''
                                WHEN %I >= NOW() - INTERVAL ''1 week'' THEN ''last_week''
                                WHEN %I >= NOW() - INTERVAL ''1 month'' THEN ''last_month''
                                WHEN %I >= NOW() - INTERVAL ''1 year'' THEN ''last_year''
                                ELSE ''older''
                            END as date_range,
                            count(*) as count
                        FROM %I 
                        WHERE %s
                        GROUP BY date_range
                    ) date_facet',
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_table,
                    base_where_clause
                ) INTO facet_values;
                
            WHEN 'range' THEN
                EXECUTE format('
                    SELECT jsonb_build_object(
                        ''min_value'', min(%I),
                        ''max_value'', max(%I),
                        ''ranges'', jsonb_object_agg(size_range, count)
                    )
                    FROM (
                        SELECT 
                            CASE 
                                WHEN %I < 1024 THEN ''< 1KB''
                                WHEN %I < 1048576 THEN ''1KB - 1MB''
                                WHEN %I < 10485760 THEN ''1MB - 10MB''
                                WHEN %I < 104857600 THEN ''10MB - 100MB''
                                ELSE ''> 100MB''
                            END as size_range,
                            count(*) as count
                        FROM %I 
                        WHERE %s
                        GROUP BY size_range
                    ) range_facet',
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_table,
                    base_where_clause
                ) INTO facet_values;
                
            WHEN 'cultural' THEN
                -- Special handling for cultural sensitivity facets
                EXECUTE format('
                    SELECT jsonb_object_agg(
                        CASE %I
                            WHEN ''public'' THEN ''Public''
                            WHEN ''community'' THEN ''Community''
                            WHEN ''restricted'' THEN ''Restricted''
                            WHEN ''sacred'' THEN ''Sacred''
                            WHEN ''ceremonial'' THEN ''Ceremonial''
                            ELSE %I
                        END,
                        count
                    ) 
                    FROM (
                        SELECT %I, count(*) as count
                        FROM %I 
                        WHERE %s
                        GROUP BY %I
                        ORDER BY 
                            CASE %I
                                WHEN ''public'' THEN 1
                                WHEN ''community'' THEN 2
                                WHEN ''restricted'' THEN 3
                                WHEN ''sacred'' THEN 4
                                WHEN ''ceremonial'' THEN 5
                                ELSE 6
                            END
                    ) cultural_facet',
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_column,
                    facet_record.source_table,
                    base_where_clause,
                    facet_record.source_column,
                    facet_record.source_column
                ) INTO facet_values;
                
            ELSE
                facet_values := '{}';
        END CASE;
        
        -- Add facet to results
        facet_results := facet_results || jsonb_build_object(
            facet_record.facet_name,
            jsonb_build_object(
                'display_name', facet_record.facet_display_name,
                'type', facet_record.facet_type,
                'cultural_facet', facet_record.cultural_facet,
                'values', COALESCE(facet_values, '{}')
            )
        );
    END LOOP;
    
    RETURN facet_results;
END;
$$ LANGUAGE plpgsql;

-- Create advanced search function with faceted filtering
CREATE OR REPLACE FUNCTION advanced_search_documents(
    p_query TEXT DEFAULT NULL,
    p_community_id UUID DEFAULT NULL,
    p_search_config TEXT DEFAULT 'standard_english',
    p_filters JSONB DEFAULT '{}',
    p_sort_by TEXT DEFAULT 'relevance',
    p_sort_order TEXT DEFAULT 'desc',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_include_facets BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
    search_results JSONB;
    facet_results JSONB := '{}';
    search_config_name TEXT;
    ts_query tsquery;
    where_conditions TEXT[] := ARRAY['1=1'];
    sort_clause TEXT;
    total_count INTEGER;
    filter_key TEXT;
    filter_value JSONB;
BEGIN
    -- Get search configuration
    SELECT ts_config_name INTO search_config_name 
    FROM search_configurations 
    WHERE config_name = p_search_config AND is_active = true;
    
    IF search_config_name IS NULL THEN
        search_config_name := 'english';
    END IF;
    
    -- Build text search condition
    IF p_query IS NOT NULL AND length(trim(p_query)) > 0 THEN
        ts_query := plainto_tsquery(search_config_name, p_query);
        where_conditions := where_conditions || ARRAY[format('(
            to_tsvector(''%s'', coalesce(title, '''')) ||
            to_tsvector(''%s'', coalesce(description, '''')) ||
            to_tsvector(''%s'', coalesce(text_content, ''''))
        ) @@ ''%s''', search_config_name, search_config_name, search_config_name, ts_query::TEXT)];
    END IF;
    
    -- Build community filter
    IF p_community_id IS NOT NULL THEN
        where_conditions := where_conditions || ARRAY[format('community_id = ''%s''', p_community_id)];
    END IF;
    
    -- Process filters from JSONB
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
    LOOP
        CASE filter_key
            WHEN 'document_type' THEN
                where_conditions := where_conditions || ARRAY[format('document_type = ANY(''%s'')', filter_value::TEXT)];
            WHEN 'cultural_sensitivity' THEN
                where_conditions := where_conditions || ARRAY[format('cultural_sensitivity_level = ANY(''%s'')', filter_value::TEXT)];
            WHEN 'language' THEN
                where_conditions := where_conditions || ARRAY[format('language = ANY(''%s'')', filter_value::TEXT)];
            WHEN 'has_cultural_content' THEN
                IF (filter_value::TEXT)::BOOLEAN THEN
                    where_conditions := where_conditions || ARRAY['requires_elder_approval = true'];
                ELSE
                    where_conditions := where_conditions || ARRAY['requires_elder_approval = false'];
                END IF;
            WHEN 'date_range' THEN
                -- Handle date range filters
                IF filter_value ? 'start_date' THEN
                    where_conditions := where_conditions || ARRAY[format('created_at >= ''%s''', filter_value->>'start_date')];
                END IF;
                IF filter_value ? 'end_date' THEN
                    where_conditions := where_conditions || ARRAY[format('created_at <= ''%s''', filter_value->>'end_date')];
                END IF;
            WHEN 'file_size_range' THEN
                -- Handle file size range filters
                IF filter_value ? 'min_size' THEN
                    where_conditions := where_conditions || ARRAY[format('file_size >= %s', filter_value->>'min_size')];
                END IF;
                IF filter_value ? 'max_size' THEN
                    where_conditions := where_conditions || ARRAY[format('file_size <= %s', filter_value->>'max_size')];
                END IF;
        END CASE;
    END LOOP;
    
    -- Build sort clause
    CASE p_sort_by
        WHEN 'relevance' THEN
            IF p_query IS NOT NULL THEN
                sort_clause := format('ts_rank_cd(
                    setweight(to_tsvector(''%s'', coalesce(title, '''')), ''A'') ||
                    setweight(to_tsvector(''%s'', coalesce(description, '''')), ''B'') ||
                    setweight(to_tsvector(''%s'', coalesce(text_content, '''')), ''C''),
                    ''%s'', 32
                ) %s', search_config_name, search_config_name, search_config_name, ts_query::TEXT, p_sort_order);
            ELSE
                sort_clause := 'created_at ' || p_sort_order;
            END IF;
        WHEN 'date' THEN
            sort_clause := 'created_at ' || p_sort_order;
        WHEN 'title' THEN
            sort_clause := 'title ' || p_sort_order;
        WHEN 'size' THEN
            sort_clause := 'file_size ' || p_sort_order;
        WHEN 'cultural_sensitivity' THEN
            sort_clause := format('CASE cultural_sensitivity_level
                WHEN ''public'' THEN 1
                WHEN ''community'' THEN 2
                WHEN ''restricted'' THEN 3
                WHEN ''sacred'' THEN 4
                WHEN ''ceremonial'' THEN 5
                ELSE 6
            END %s', p_sort_order);
        ELSE
            sort_clause := 'created_at ' || p_sort_order;
    END CASE;
    
    -- Execute search query
    EXECUTE format('
        WITH search_results AS (
            SELECT 
                id,
                title,
                filename,
                cultural_sensitivity_level,
                document_type,
                language,
                file_size,
                created_at,
                %s
            FROM documents
            WHERE %s
            ORDER BY %s
            LIMIT %s OFFSET %s
        ),
        total_count AS (
            SELECT count(*) as total
            FROM documents
            WHERE %s
        )
        SELECT jsonb_build_object(
            ''results'', jsonb_agg(
                jsonb_build_object(
                    ''id'', sr.id,
                    ''title'', sr.title,
                    ''filename'', sr.filename,
                    ''cultural_sensitivity_level'', sr.cultural_sensitivity_level,
                    ''document_type'', sr.document_type,
                    ''language'', sr.language,
                    ''file_size'', sr.file_size,
                    ''created_at'', sr.created_at,
                    ''rank'', sr.rank
                )
            ),
            ''total_count'', (SELECT total FROM total_count),
            ''limit'', %s,
            ''offset'', %s
        )
        FROM search_results sr',
        CASE WHEN p_query IS NOT NULL THEN format('ts_rank_cd(
            setweight(to_tsvector(''%s'', coalesce(title, '''')), ''A'') ||
            setweight(to_tsvector(''%s'', coalesce(description, '''')), ''B'') ||
            setweight(to_tsvector(''%s'', coalesce(text_content, '''')), ''C''),
            ''%s'', 32
        ) as rank', search_config_name, search_config_name, search_config_name, ts_query::TEXT)
        ELSE '0 as rank' END,
        array_to_string(where_conditions, ' AND '),
        sort_clause,
        p_limit,
        p_offset,
        array_to_string(where_conditions, ' AND '),
        p_limit,
        p_offset
    ) INTO search_results;
    
    -- Get facets if requested
    IF p_include_facets THEN
        facet_results := get_search_facets(
            p_query,
            p_community_id,
            p_search_config,
            'all_accessible',
            NULL,
            p_filters
        );
    END IF;
    
    -- Combine results and facets
    RETURN search_results || jsonb_build_object('facets', facet_results);
END;
$$ LANGUAGE plpgsql;

SELECT 'Faceted search system with cultural filtering created successfully' as status;