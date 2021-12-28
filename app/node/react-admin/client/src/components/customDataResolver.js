import simpleRestProvider from 'ra-data-simple-rest';
import { fetchUtils } from 'ra-core';
import _ from 'underscore';

const riskProvider = simpleRestProvider('http://localhost:3005/api', fetchUtils.fetchJson, 'X-Total-Count');
// const mitigationProvider = simpleRestProvider('http://localhost:3005/api', fetchUtils.fetchJson, 'X-Total-Count');

let risks;
let mitigations;
let securitycontrols;
const myDataProvider = {
    ...riskProvider,
    getList: async (resource, params) => {
        if (resource === 'risks') {
            if (!risks) {// fallback to the default implementation
                return riskProvider.getList(resource, params)
                    .then((data) => {
                        risks = data;
                        return data;
                    });
            } else {
                if (params.sort) {
                    if (params.sort.order === 'ASC') {
                        risks.data = _.sortBy(risks.data, params.sort.field);
                        return risks
                    } else {
                        risks.data = _.sortBy(risks.data, params.sort.field).reverse();
                        return risks
                    }
                } else {
                    return risks;
                }
            }
        }
        if (resource === 'mitigations') {
            if (!mitigations) {// fallback to the default implementation
                return riskProvider.getList(resource, params)
                    .then((data) => {
                        mitigations = data;
                        return data;
                    });
            } else {
                if (params.sort) {
                    if (params.sort.order === 'ASC') {
                        mitigations.data = _.sortBy(mitigations.data, params.sort.field);
                        return mitigations
                    } else {
                        mitigations.data = _.sortBy(mitigations.data, params.sort.field).reverse();
                        return mitigations
                    }
                } else {
                    return mitigations;
                }
            }
        }
        if (resource === 'securitycontrols') {
            if (!securitycontrols) {// fallback to the default implementation
                return riskProvider.getList(resource, params)
                    .then((data) => {
                        securitycontrols = data;
                        return data;
                    });
            } else {
                if (params.sort) {
                    if (params.sort.order === 'ASC') {
                        securitycontrols.data = _.sortBy(securitycontrols.data, params.sort.field);
                        return securitycontrols
                    } else {
                        securitycontrols.data = _.sortBy(securitycontrols.data, params.sort.field).reverse();
                        return securitycontrols
                    }
                } else {
                    return securitycontrols;
                }
            }
        }
        else{
            return riskProvider.getList(resource, params);
        }

    },
    getOne: async (resource, params) => {
        return riskProvider.getOne(resource, params);
        //     if (resource === 'risks') {
        //         if (risks) {
        //             const ind= _.findIndex(risks.data, {id:params.id});
        //             return risks.data[ind];
        //         } else {
        //            return riskProvider.getOne(resource,params);
        //     }
        // }
        //     // if (resource === 'mitigations') {
        //     //     if (!mitigations) {// fallback to the default implementation
        //     //         return riskProvider.getList(resource, params)
        //     //             .then((data) => {
        //     //                 mitigations = data;
        //     //                 return data;
        //     //             });
        //     //     } else {
        //     //         if (params.sort) {
        //     //             if (params.sort.order === 'ASC') {
        //     //                 mitigations.data = _.sortBy(mitigations.data, params.sort.field);
        //     //                 return mitigations
        //     //             } else {
        //     //                 mitigations.data = _.sortBy(mitigations.data, params.sort.field).reverse();
        //     //                 return mitigations
        //     //             }
        //     //         } else {
        //     //             return mitigations;
        //     //         }
        //     //     }
        //     // }
        //     // if (resource === 'securitycontrols') {
        //     //     if (!securitycontrols) {// fallback to the default implementation
        //     //         return riskProvider.getList(resource, params)
        //     //             .then((data) => {
        //     //                 securitycontrols = data;
        //     //                 return data;
        //     //             });
        //     //     } else {
        //     //         if (params.sort) {
        //     //             if (params.sort.order === 'ASC') {
        //     //                 securitycontrols.data = _.sortBy(securitycontrols.data, params.sort.field);
        //     //                 return securitycontrols
        //     //             } else {
        //     //                 securitycontrols.data = _.sortBy(securitycontrols.data, params.sort.field).reverse();
        //     //                 return securitycontrols
        //     //             }
        //     //         } else {
        //     //             return securitycontrols;
        //     //         }
        //     //     }
        //     // }

        // }

    },
    getMany: async (resource, params) => {
        return riskProvider.getMany(resource, params);
    },
    update: async (resource, params) => {
        return riskProvider.update(resource, params);
    },
    updateMany: async (resource, params) => {
        return riskProvider.updateMany(resource, params);
    },
    getManyReference: async (resource, params) => {
        return riskProvider.getManyReference(resource, params)
    },
    create: async (resource, params) => {
        return riskProvider.create(resource, params);
    },
    delete: async (resource, params) => {
        return riskProvider.delete(resource, params);
    },
    deleteMany: async (resource, params) => {
        return riskProvider.deleteMany(resource, params);
    }
}


export default myDataProvider
