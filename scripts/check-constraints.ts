
import { sql } from './db-standalone';

async function checkConstraints() {
    console.log('--- CHECKING FK CONSTRAINTS ---');
    try {
        const constraints = await sql`
            SELECT 
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name, 
                rc.update_rule, 
                rc.delete_rule
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.referential_constraints AS rc
                  ON tc.constraint_name = rc.constraint_name
            WHERE 
                tc.constraint_type = 'FOREIGN KEY' 
                AND kcu.column_name = 'user_id'
        `;

        console.table(constraints);

        const orgMemberConstraint = constraints.find((c: any) => c.table_name === 'organization_members');
        if (orgMemberConstraint && orgMemberConstraint.update_rule !== 'CASCADE') {
            console.error('CRITICAL: organization_members.user_id does NOT CASCADE on update!');
            console.log('Action Required: Manually handle ID updates in ensureProfile.');
        } else {
            console.log('organization_members.user_id CASCADES on update. Safe to update profiles.id.');
        }

    } catch (error) {
        console.error('DB Error:', error);
    }
}

checkConstraints();
