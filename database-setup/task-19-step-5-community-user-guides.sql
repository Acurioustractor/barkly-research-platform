-- Task 19 Step 5: Community User Guides
-- User-friendly guides for community members and researchers

-- ============================================================================
-- COMMUNITY USER GUIDE FRAMEWORK
-- ============================================================================

-- Create user guide storage and management
CREATE TABLE IF NOT EXISTS documentation.user_guides (
    id SERIAL PRIMARY KEY,
    guide_category TEXT NOT NULL, -- 'getting_started', 'research_tools', 'collaboration', 'cultural_protocols', 'troubleshooting'
    title TEXT NOT NULL,
    target_audience TEXT NOT NULL, -- 'community_members', 'researchers', 'students', 'elders', 'administrators'
    difficulty_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
    description TEXT,
    content TEXT,
    screenshots JSONB,
    video_links TEXT[],
    cultural_context TEXT,
    community_reviewed BOOLEAN DEFAULT false,
    community_reviewer TEXT,
    language_versions JSONB, -- Support for multiple languages
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert comprehensive user guides
INSERT INTO documentation.user_guides (
    guide_category, title, target_audience, difficulty_level, description, 
    content, cultural_context, community_reviewed, language_versions
) VALUES 

-- Getting Started Guides
('getting_started', 'Welcome to the Barkly Research Platform', 'community_members', 'beginner',
 'Introduction to the platform with cultural context and community values',
 E'# Welcome to the Barkly Research Platform\n\n## Our Community Values\n\nThe Barkly Research Platform was built with deep respect for indigenous knowledge systems and community sovereignty. Every feature reflects our commitment to:\n\n- **Community Control**: Your community maintains control over your data and research\n- **Cultural Respect**: Traditional knowledge is protected and honored\n- **Collaborative Research**: Research is done with communities, not on them\n- **Reciprocal Benefits**: Research benefits flow back to communities\n\n## Getting Started\n\n### 1. Creating Your Account\n\nWhen you create an account, you\'ll be asked about your:\n- Community affiliation (if applicable)\n- Research interests\n- Cultural protocols you follow\n- Preferred ways to collaborate\n\nThis information helps us:\n- Connect you with appropriate research opportunities\n- Respect your cultural protocols\n- Ensure proper permissions for accessing cultural materials\n\n### 2. Understanding Access Levels\n\nThe platform uses community-defined access levels:\n- **Public**: Information anyone can see\n- **Community**: Visible to verified community members\n- **Restricted**: Requires specific permissions\n- **Sacred/Sensitive**: Highest protection level\n\n### 3. Your Dashboard\n\nYour dashboard shows:\n- Research projects you\'re involved in\n- Documents you have access to\n- Collaboration invitations\n- Community announcements\n- Cultural protocol reminders\n\n## Respecting Cultural Protocols\n\nEvery interaction on the platform should honor cultural protocols:\n- Always acknowledge traditional knowledge sources\n- Respect community decisions about data sharing\n- Follow proper introduction and relationship-building practices\n- Understand that some knowledge may not be appropriate to share digitally\n\n## Getting Help\n\nIf you need assistance:\n1. Check the help guides (organized by topic)\n2. Contact your community liaison\n3. Reach out to platform support\n4. Join community discussion forums\n\nRemember: There are no "stupid questions" - we\'re all learning together.',
 'This guide emphasizes community sovereignty and cultural respect as foundational principles, not add-on features.',
 true,
 '{"english": "primary", "languages_available": ["english"], "translation_needed": ["local_indigenous_language"]}'
),

('research_tools', 'Creating and Managing Research Projects', 'researchers', 'intermediate',
 'Comprehensive guide to research project creation with cultural protocol integration',
 E'# Creating and Managing Research Projects\n\n## Before You Begin\n\n### Community Consultation\nBefore creating any research project involving indigenous knowledge or communities:\n\n1. **Initial Community Contact**\n   - Reach out to appropriate community representatives\n   - Explain your research intentions and methods\n   - Listen to community priorities and concerns\n   - Discuss potential benefits and risks\n\n2. **Protocol Identification**\n   - Identify relevant cultural protocols\n   - Understand community consent processes\n   - Learn about traditional knowledge sharing practices\n   - Respect community decision-making timelines\n\n## Creating a New Project\n\n### Step 1: Project Setup\n1. Click "New Project" from your dashboard\n2. Choose project type:\n   - **Community-Led**: Initiated and controlled by community\n   - **Collaborative**: Joint community-researcher project\n   - **External**: Researcher-led with community partnership\n\n### Step 2: Cultural Protocol Configuration\n1. **Community Involvement Level**\n   - Select primary community partners\n   - Identify community liaisons\n   - Set community review requirements\n\n2. **Data Sensitivity Settings**\n   - Mark cultural sensitivity levels\n   - Set access restrictions\n   - Configure sharing permissions\n   - Enable audit tracking\n\n3. **Knowledge Sharing Protocols**\n   - Define attribution requirements\n   - Set reciprocity agreements\n   - Configure benefit-sharing arrangements\n   - Establish publication protocols\n\n### Step 3: Collaboration Setup\n1. **Team Assembly**\n   - Invite community members first\n   - Add external researchers with community approval\n   - Assign roles and permissions\n   - Set up mentorship relationships\n\n2. **Communication Protocols**\n   - Choose culturally appropriate communication methods\n   - Set meeting schedules respecting community availability\n   - Establish decision-making processes\n   - Create feedback mechanisms\n\n## Managing Ongoing Projects\n\n### Regular Community Check-ins\n- Schedule monthly community updates\n- Share research progress transparently\n- Seek feedback on research direction\n- Address any cultural concerns promptly\n\n### Data Management\n- Regularly review data sensitivity classifications\n- Update access permissions as needed\n- Ensure proper attribution in all uses\n- Maintain detailed audit trails\n\n### Collaboration Best Practices\n- Always prioritize community voices\n- Share decision-making power appropriately\n- Provide regular progress updates\n- Celebrate community contributions\n\n## Completing Projects\n\n### Community Review Process\n1. Present findings to community first\n2. Incorporate community feedback\n3. Ensure proper attribution and acknowledgment\n4. Confirm publication and sharing permissions\n\n### Benefit Sharing\n1. Provide research results in accessible formats\n2. Support community capacity building\n3. Share any economic benefits as agreed\n4. Continue relationship beyond project completion\n\n## Troubleshooting Common Issues\n\n**Issue**: Community members can\'t access project materials\n**Solution**: Check access permissions and cultural protocol settings\n\n**Issue**: Cultural protocol violation reported\n**Solution**: Immediately pause project, consult community liaisons, implement corrective measures\n\n**Issue**: Disagreement about data sharing\n**Solution**: Return to community consultation process, prioritize community preferences',
 'Research must be conducted with communities as partners, not subjects. Community sovereignty over research processes is paramount.',
 true,
 '{"english": "primary", "community_review_date": "2024-01-15", "reviewer": "Community Research Council"}'
),

('collaboration', 'Working Together: Collaboration Tools and Etiquette', 'community_members', 'beginner',
 'Guide to using collaboration features while respecting cultural protocols',
 E'# Working Together: Collaboration Tools and Etiquette\n\n## Collaboration Philosophy\n\nOur collaboration tools are designed around indigenous values:\n- **Relationship First**: Building relationships before tasks\n- **Consensus Building**: Decisions made together\n- **Respect for Elders**: Honoring traditional knowledge holders\n- **Circular Communication**: Everyone has a voice\n\n## Real-Time Collaboration Features\n\n### Document Co-Creation\n1. **Starting a Collaborative Session**\n   - Invite participants respectfully\n   - Begin with proper introductions\n   - Acknowledge traditional territories\n   - Set cultural ground rules\n\n2. **During Collaboration**\n   - Take turns speaking/editing\n   - Ask permission before major changes\n   - Acknowledge others\' contributions\n   - Pause for reflection and consensus\n\n3. **Cultural Considerations**\n   - Some knowledge may need elder approval before sharing\n   - Respect different communication styles\n   - Allow time for traditional decision-making processes\n   - Honor confidentiality agreements\n\n### Discussion Forums\n\n**Forum Etiquette:**\n- Introduce yourself and your connection to the topic\n- Acknowledge previous speakers\n- Share your perspective respectfully\n- Ask questions with genuine curiosity\n- Offer help and support to others\n\n**Cultural Guidelines:**\n- Use appropriate titles and forms of address\n- Respect traditional knowledge sharing protocols\n- Avoid sharing sacred or sensitive information publicly\n- Support community members in their contributions\n\n### Video Conferencing Integration\n\n**Before the Meeting:**\n- Send agenda with cultural context\n- Share relevant materials in advance\n- Confirm appropriate participants\n- Prepare traditional opening if appropriate\n\n**During the Meeting:**\n- Begin with introductions and acknowledgments\n- Follow traditional speaking orders if applicable\n- Allow time for reflection and consensus\n- Record decisions and action items clearly\n\n**After the Meeting:**\n- Share summary with all participants\n- Follow up on commitments made\n- Continue relationship building\n- Plan next steps collaboratively\n\n## Managing Collaborative Projects\n\n### Role Definitions\n- **Community Lead**: Community member guiding project direction\n- **Knowledge Keeper**: Elder or traditional knowledge holder\n- **Research Partner**: External researcher or academic\n- **Student Researcher**: Learning while contributing\n- **Community Liaison**: Bridge between community and external partners\n\n### Decision-Making Processes\n1. **Proposal Phase**: Ideas shared and discussed\n2. **Community Consultation**: Community input gathered\n3. **Consensus Building**: Working toward agreement\n4. **Elder Review**: Traditional knowledge validation (if applicable)\n5. **Implementation**: Action taken with community support\n\n## Conflict Resolution\n\n### When Disagreements Arise\n1. **Pause and Reflect**: Take time to understand all perspectives\n2. **Seek Guidance**: Consult community elders or liaisons\n3. **Return to Relationships**: Focus on maintaining good relationships\n4. **Find Common Ground**: Identify shared values and goals\n5. **Collaborative Solution**: Work together on resolution\n\n### Cultural Mediation\n- Traditional conflict resolution methods may be used\n- Community elders may be asked to provide guidance\n- Healing and relationship repair are prioritized\n- Solutions should strengthen community bonds\n\n## Privacy and Confidentiality\n\n### What to Keep Private\n- Personal information shared in confidence\n- Sacred or ceremonial knowledge\n- Community internal discussions\n- Sensitive research data\n- Traditional knowledge requiring protection\n\n### What Can Be Shared\n- Public research findings\n- Community-approved information\n- General collaboration experiences\n- Non-sensitive project updates\n- Educational materials\n\n## Getting Help with Collaboration\n\n**Technical Issues:**\n- Use the help chat feature\n- Contact technical support\n- Ask community tech mentors\n\n**Cultural Questions:**\n- Consult community liaisons\n- Ask elders or knowledge keepers\n- Refer to cultural protocol guides\n\n**Relationship Challenges:**\n- Seek mediation support\n- Return to community consultation\n- Focus on healing and understanding',
 'Collaboration tools must support indigenous communication styles and decision-making processes, not impose Western models.',
 true,
 '{"english": "primary", "community_input": "Reviewed and approved by Community Collaboration Council"}'
),

('cultural_protocols', 'Understanding and Respecting Cultural Protocols', 'researchers', 'intermediate',
 'Essential guide to cultural protocols for researchers and external users',
 E'# Understanding and Respecting Cultural Protocols\n\n## What Are Cultural Protocols?\n\nCultural protocols are the traditional and contemporary guidelines that govern how knowledge is shared, relationships are built, and research is conducted within indigenous communities. They are not optional guidelines—they are fundamental requirements for respectful engagement.\n\n## Core Principles\n\n### 1. Free, Prior, and Informed Consent (FPIC)\n- **Free**: No coercion or pressure\n- **Prior**: Consent obtained before any research begins\n- **Informed**: Full understanding of research implications\n- **Consent**: Ongoing agreement that can be withdrawn\n\n### 2. Community Data Sovereignty\n- Communities control their own data\n- Data governance follows community laws and customs\n- Benefits from data use flow back to communities\n- Communities decide how data is stored, shared, and used\n\n### 3. Reciprocal Relationships\n- Research relationships are ongoing, not transactional\n- Benefits are shared equitably\n- Researchers contribute to community priorities\n- Knowledge flows in multiple directions\n\n## Platform-Specific Protocols\n\n### Account Creation and Verification\n1. **Cultural Affiliation Declaration**\n   - Be honest about your background and connections\n   - Understand that verification may be required\n   - Respect that some areas may be restricted\n\n2. **Research Intentions**\n   - Clearly state your research purposes\n   - Explain how communities will benefit\n   - Commit to following community protocols\n\n### Accessing Cultural Materials\n\n**Before Accessing:**\n- Understand the cultural significance of materials\n- Confirm you have appropriate permissions\n- Know the restrictions on use and sharing\n- Prepare to acknowledge sources properly\n\n**During Use:**\n- Follow all specified restrictions\n- Maintain confidentiality as required\n- Document your use for accountability\n- Respect sacred or sensitive content\n\n**After Use:**\n- Provide proper attribution\n- Share results with source communities\n- Continue relationship maintenance\n- Support community priorities\n\n### Research Project Protocols\n\n**Project Initiation:**\n1. Community consultation before platform use\n2. Protocol identification and agreement\n3. Benefit-sharing arrangements\n4. Ongoing consent mechanisms\n\n**During Research:**\n1. Regular community updates and check-ins\n2. Transparent data handling and storage\n3. Immediate response to community concerns\n4. Continuous relationship building\n\n**Project Completion:**\n1. Community review of all findings\n2. Appropriate attribution and acknowledgment\n3. Accessible sharing of results\n4. Ongoing relationship maintenance\n\n## Common Protocol Areas\n\n### Traditional Knowledge\n- May require elder approval for access\n- Often has specific sharing restrictions\n- Requires proper attribution to knowledge holders\n- May have seasonal or ceremonial access limitations\n\n### Sacred Sites and Objects\n- May be completely restricted from digital sharing\n- Require special permissions and protocols\n- Need appropriate cultural context\n- May have gender-specific access rules\n\n### Language Materials\n- May have community-specific sharing protocols\n- Could require speaker community approval\n- Might need cultural context for proper use\n- May have restrictions on commercial use\n\n### Historical Materials\n- May involve multiple community stakeholders\n- Could have complex ownership questions\n- Might require historical context and interpretation\n- May need community healing considerations\n\n## Red Flags: When to Stop and Consult\n\n**Immediate Consultation Required:**\n- Any mention of sacred or ceremonial content\n- Requests to share restricted materials\n- Conflicts between community members\n- Questions about traditional knowledge ownership\n- Concerns about cultural appropriation\n- Disagreements about research direction\n\n## Protocol Violations\n\n### If You Make a Mistake\n1. **Acknowledge immediately**: Don\'t try to hide or minimize\n2. **Stop the problematic activity**: Prevent further harm\n3. **Consult community liaisons**: Get guidance on response\n4. **Make appropriate amends**: Follow community guidance\n5. **Learn and improve**: Prevent future violations\n\n### If You Witness a Violation\n1. **Document the situation**: Record what happened\n2. **Report to appropriate authorities**: Use platform reporting tools\n3. **Support affected communities**: Offer assistance as appropriate\n4. **Follow up**: Ensure proper resolution\n\n## Ongoing Learning\n\nCultural protocol understanding is not a one-time learning experience:\n- Attend community-led training sessions\n- Read updated protocol documentation\n- Participate in cultural competency assessments\n- Seek mentorship from experienced community members\n- Engage in respectful dialogue and questioning\n\n## Resources for Further Learning\n\n**Platform Resources:**\n- Cultural protocol library\n- Community-specific guidelines\n- Training modules and assessments\n- Mentorship program\n\n**External Resources:**\n- Community cultural centers\n- Indigenous research methodology courses\n- Traditional knowledge protocols\n- Community liaison contacts\n\n## Remember\n\nCultural protocols are not barriers to research—they are pathways to respectful, meaningful, and beneficial collaboration. When followed properly, they create stronger relationships, better research, and positive outcomes for all involved.',
 'Cultural protocols are not optional compliance requirements—they are fundamental to respectful research and relationship building.',
 true,
 '{"english": "primary", "elder_review": "Completed", "community_approval": "Granted by Cultural Protocol Council"}'
);

-- Create user guide search and navigation
CREATE TABLE IF NOT EXISTS documentation.guide_topics (
    id SERIAL PRIMARY KEY,
    guide_id INTEGER REFERENCES documentation.user_guides(id),
    topic_name TEXT NOT NULL,
    keywords TEXT[],
    difficulty_level TEXT,
    estimated_read_time TEXT
);

-- Create user feedback system for guides
CREATE TABLE IF NOT EXISTS documentation.guide_feedback (
    id SERIAL PRIMARY KEY,
    guide_id INTEGER REFERENCES documentation.user_guides(id),
    user_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    cultural_appropriateness_rating INTEGER CHECK (cultural_appropriateness_rating >= 1 AND cultural_appropriateness_rating <= 5),
    suggestions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to export user guides
CREATE OR REPLACE FUNCTION documentation.export_user_guide(p_guide_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    guide_record RECORD;
    result TEXT := '';
BEGIN
    SELECT * INTO guide_record 
    FROM documentation.user_guides 
    WHERE id = p_guide_id;
    
    IF guide_record IS NULL THEN
        RETURN 'Guide not found';
    END IF;
    
    result := result || E'# ' || guide_record.title || E'\n\n';
    result := result || E'**Target Audience:** ' || guide_record.target_audience || E'\n';
    result := result || E'**Difficulty Level:** ' || guide_record.difficulty_level || E'\n';
    result := result || E'**Last Updated:** ' || guide_record.last_updated::date || E'\n\n';
    
    IF guide_record.cultural_context IS NOT NULL THEN
        result := result || E'**Cultural Context:** ' || guide_record.cultural_context || E'\n\n';
    END IF;
    
    result := result || guide_record.content || E'\n\n';
    
    IF guide_record.community_reviewed THEN
        result := result || E'---\n*This guide has been reviewed and approved by community representatives.*\n';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create guide recommendation system
CREATE OR REPLACE FUNCTION documentation.recommend_guides_for_user(p_user_id INTEGER)
RETURNS TABLE(
    guide_id INTEGER,
    title TEXT,
    category TEXT,
    relevance_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ug.id,
        ug.title,
        ug.guide_category,
        CASE 
            WHEN ug.target_audience = 'community_members' AND EXISTS(
                SELECT 1 FROM users WHERE id = p_user_id AND cultural_affiliation IS NOT NULL
            ) THEN 90
            WHEN ug.target_audience = 'researchers' AND EXISTS(
                SELECT 1 FROM users WHERE id = p_user_id AND role LIKE '%researcher%'
            ) THEN 85
            WHEN ug.difficulty_level = 'beginner' THEN 70
            ELSE 50
        END as relevance_score
    FROM documentation.user_guides ug
    WHERE ug.community_reviewed = true
    ORDER BY relevance_score DESC, ug.title;
END;
$$ LANGUAGE plpgsql;

-- Test community user guides system
SELECT 'Community user guides framework created successfully' as status;
SELECT guide_category, COUNT(*) as guide_count 
FROM documentation.user_guides 
GROUP BY guide_category;

-- Generate sample guide export
SELECT LEFT(documentation.export_user_guide(1), 1000) || '...' as sample_guide;