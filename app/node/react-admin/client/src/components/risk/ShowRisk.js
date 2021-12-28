import * as React from "react";
import { Show, ReferenceManyField,SingleFieldList,ChipField, SimpleShowLayout, TextField, DateField, RichTextField } from 'react-admin';

const ShowRisk = (props) => (
    <Show {...props}>
        <SimpleShowLayout>
            <TextField   source='id'/>
            <TextField source ='rname'/>
            <TextField source ='assessment.aid'/>
            <TextField multiline source ='rdescription'/>
            <TextField   source ='ownerorg.orgname'/>
            <TextField   source ='ownerorg.suborgname'/>
            <TextField source ='likelihood'/>
            <TextField source ='impact'/>
            <TextField source ='acceptance'/>
            <TextField   source ='rstatus'/>
            <TextField   source ='rorganization.orgname'/>
            <ReferenceManyField label="Affected by" reference="mitigations" target="rdid">
                <SingleFieldList>
                    <ChipField source="mname" />
                </SingleFieldList>
            </ReferenceManyField>
            


        </SimpleShowLayout>
    </Show>
);

export default ShowRisk;