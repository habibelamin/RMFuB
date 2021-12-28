import * as React from "react";
import { Show, SimpleShowLayout,ReferenceArrayField, ChipField, ReferenceManyField, SingleFieldList, TextField, DateField, RichTextField } from 'react-admin';

const ShowMitigation = (props) => (
    <Show {...props}>
        <SimpleShowLayout>
        <TextField   source='id'/>
        <TextField label="Name" source ='mname'/>
        <TextField label="Description" multiline source ='mdescription'/>
        <TextField label="Approve Responsible"  source ='avresponsible'/>
        <TextField label="Organization"    source ='morganization.orgname'/>
        <TextField label="SubOrganization"   source ='morganization.suborgname'/>
        <TextField label="Status"   source ='mstatus'/>
                {/* <TextField source ='riskdeps'/> */}
                
        {/* <SimpleFormIterator>
                        

                        
            <ReferenceManyField  reference="risks" target="rdid">
                <SingleFieldList>
                    <ChipField source="id" />
                </SingleFieldList>
            </ReferenceManyField>
                       

            <TextField source="rdname" />
            <TextField source="mlikelihood" />
            <TextField source="mimpact" />
        </SimpleFormIterator> */}
                {/* <TextField   source ='scdeps'/> */}

        {/*scdeps refrence  */}
            <ReferenceManyField  label="Security Controls" reference="securitycontrols" target="id">
                <SingleFieldList>
                    <ChipField source="sname" />
                </SingleFieldList>
            </ReferenceManyField>
            <ReferenceArrayField label="Security Controls" source="scdeps.[].id" reference="securitycontrols" target="id">
                <SingleFieldList>
                    <ChipField source="name" />
                </SingleFieldList>
            </ReferenceArrayField>




        </SimpleShowLayout>
    </Show>
);

export default ShowMitigation;