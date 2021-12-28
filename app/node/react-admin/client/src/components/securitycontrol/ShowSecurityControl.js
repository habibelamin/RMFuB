import React from 'react'
import { Show, SimpleShowLayout,ReferenceField, ChipField, ReferenceManyField, SingleFieldList, TextField } from 'react-admin';

const ShowSecurityControl = (props) => (
    <Show {...props}>
        <SimpleShowLayout>

            <TextField source='id' />
            <TextField source='sname' label='Security Control Name' />
            {/* <TextField multiline source='sdescription' /> */}
            <TextField source='apresponsible' label='Applier' />
            <TextField source='sorganization.orgname' label='Organization' />
            {/* <TextField source='sorganization.suborgname' /> */}
            <TextField source="sstatus" label='Status' />
            <ReferenceField label="Related Security Control Id" source="supid" reference="securitycontrols" target ="id">
                <TextField source="sname" />
            </ReferenceField>
            <ReferenceField label="Mitigation Id" source="mdid" reference="mitigations">
                <TextField source="mname" />
            </ReferenceField>
            <ReferenceManyField  label="Security Controls" reference="securitycontrols" source ="supid" target="id">
                <SingleFieldList>
                    <ChipField source="sname" />
                </SingleFieldList>
            </ReferenceManyField>
        </SimpleShowLayout>

    </Show>

);

export default ShowSecurityControl