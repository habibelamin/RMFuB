/*
SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"encoding/base64"

	// "crypto/sha256"
	"encoding/json"
	"fmt"
	"time"

	// "log"
	// "strconv"
	"strings"

	"github.com/golang/protobuf/ptypes"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// const index = "riskid"

// const index = "riskname~orgname~assessid"

type SmartContract struct {
	contractapi.Contract
}

type Organization struct {
	Orgname    string `json:"orgname"`
	SubOrgname string `json:"suborgname"` //user affiliation
}

type Assessment struct {
	AssessId    int    `json:"aid"`
	RiskManager string `json:"riskmanager"`
	// Date        string `json:"date"`
}

type Risk struct {
	RiskId       string       `json:"id"`
	Name         string       `json:"rname"`
	Description  string       `json:"rdescription"`
	Likelihood   float32      `json:"likelihood"`
	Impact       float32      `json:"impact"`
	Time         string       `json:"created"`
	Owner        Organization `json:"ownerorg"`
	Value        float32      `json:"value"`
	Status       string       `json:"rstatus"`
	Acceptance   float32      `json:"acceptance"`
	Organization Organization `json:"rorganization"`
	Assessment   Assessment   `json:"assessment"`
}

type RiskDep struct {
	RiskId     string  `json:"rdid"`
	RiskName   string  `json:"rdname"`
	Likelihood float32 `json:"mlikelihood"`
	Impact     float32 `json:"mimpact"`
}
type SCDep struct {
	SecurityControlId string `json:"scid"`
}

type Mitigation struct {
	MitigationId       string       `json:"id"`
	Name               string       `json:"mname"`
	Description        string       `json:"mdescription"`
	Status             string       `json:"mstatus"`
	ApplyResponsible   string       `json:"apresponsible"`
	ApproveResponsible string       `json:"avresponsible"`
	Time               string       `json:"created"`
	Organization       Organization `json:"morganization"`
	RiskDeps           []RiskDep    `json:"riskdeps,omitempty" metadata:"riskdeps,optional" `
	SCDeps             []SCDep      `json:"scdeps,omitempty" metadata:"scdeps,optional" `
}

type SecurityControl struct {
	SecuritycontrolId string       `json:"id"`
	MitigationId      string       `json:"mdid"`
	SupScId           string       `json:"supid"`
	Name              string       `json:"sname"`
	Time              string       `json:"created"`
	Description       string       `json:"sdescription"`
	ApplyResponsible  string       `json:"apresponsible"`
	Organization      Organization `json:"sorganization"`
	Status            string       `json:"sstatus"`
	SCDeps            []SCDep      `json:"scdeps,omitempty" metadata:"scdeps,optional" `
}

// HistoryQueryResult structure used for returning result of history query
type HistoryQueryRiskResult struct {
	Record    *Risk     `json:"record"`
	TxId      string    `json:"txId"`
	Timestamp time.Time `json:"timestamp"`
	IsDelete  bool      `json:"isDelete"`
}

// PaginatedQueryResult structure used for returning paginated query results and metadata
type PaginatedQueryRiskResult struct {
	Records             []*Risk `json:"records"`
	FetchedRecordsCount int32   `json:"fetchedRecordsCount"`
	Bookmark            string  `json:"bookmark"`
}
type HistoryQueryMitigationResult struct {
	Record    *Mitigation `json:"record"`
	TxId      string      `json:"txId"`
	Timestamp time.Time   `json:"timestamp"`
	IsDelete  bool        `json:"isDelete"`
}

// PaginatedQueryResult structure used for returning paginated query results and metadata
type PaginatedQueryMitigationResult struct {
	Records             []*Mitigation `json:"records"`
	FetchedRecordsCount int32         `json:"fetchedRecordsCount"`
	Bookmark            string        `json:"bookmark"`
}

type HistoryQuerySecurityControlResult struct {
	Record    *SecurityControl `json:"record"`
	TxId      string           `json:"txId"`
	Timestamp time.Time        `json:"timestamp"`
	IsDelete  bool             `json:"isDelete"`
}

//Code Start
//Identity Access Control Check
func GetAccess(ctx contractapi.TransactionContextInterface, att string) string {

	val, ok, err := cid.GetAttributeValue(ctx.GetStub(), att)
	if err != nil {
		// There was an error trying to retrieve the attribute
	}
	if !ok {
		// The client identity does not possess the attribute
	}
	// Do something with the value of 'val'
	return val
}

func CheckAccess(ctx contractapi.TransactionContextInterface, att string, value string) bool {

	val, ok, err := cid.GetAttributeValue(ctx.GetStub(), att)
	if err != nil {
		// There was an error trying to retrieve the attribute
	}
	if !ok {
		// The client identity does not possess the attribute
	}
	// Do something with the value of 'val'
	if val != value {
		fmt.Println("Attribute role: " + val)
		return true
	}
	return false
}
func GetUserInfo(ctx contractapi.TransactionContextInterface) []string {
	//"x509::CN=appUser2,OU=client+OU=org0+OU=department1::CN=ca1.org0.example.com,O=org0.example.com,L=Raleigh,ST=North Carolina,C=US"
	id64, _ := cid.GetID(ctx.GetStub())
	identity, _ := base64.StdEncoding.DecodeString(id64)
	identitystr := string(identity[:])
	iden := strings.Split(identitystr, "::")
	department := strings.Split(iden[1], "+")
	if len(department) < 2 {
		use := strings.Split(department[0], ",")
		user := use[0][3:]
		all := []string{user, "", ""}
		return all
	}
	ou1 := department[1]
	ou2 := department[2]
	dep := ou1[3:] + "." + ou2[3:]
	use := strings.Split(department[0], ",")
	user := use[0][3:]
	ide := strings.Split(iden[2], ",")
	id := ide[1]
	org := id[2:]

	all := []string{user, dep, org}

	return all
}

func (s *SmartContract) Init(ctx contractapi.TransactionContextInterface) error {
	// if CheckAccess(ctx,"role", "RiskManager") {
	// 	fmt.Println("Access Denied")
	// 	return nil
	// }
	// info := GetUserInfo(ctx)
	// risk := Risk{
	// 	RiskId:       "1",
	// 	Name:         "insider",
	// 	Likelihood:   0,
	// 	Impact:       0,
	// 	Owner:        Organization{Orgname: info[2], SubOrgname: info[1]},
	// 	Status:       GetRiskStatus(0, 0, 0.2),
	// 	Acceptance:   0.2,
	// 	Organization: Organization{Orgname: info[2], SubOrgname: info[1]},
	// 	Assessment:   Assessment{AssessId: 1, RiskManager: info[0], Date: "now"},
	// }

	// riskasBytes, _ := json.Marshal(risk)
	// // err = ctx.GetStub().PutState("RISK1", riskasBytes)
	// err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), "RISK1", riskasBytes)
	// if err != nil {
	// 	return fmt.Errorf("Failed to put to world state. %s", err.Error())
	// }

	// err := ctx.GetStub().PutState("RISKCOUNT", []byte(strconv.Itoa(0)))
	// if err != nil {
	// 	return fmt.Errorf("Failed to put to world state. %s", err.Error())
	// }
	// err = ctx.GetStub().PutState("MITIGATIONCOUNT", []byte(strconv.Itoa(0)))
	// if err != nil {
	// 	return fmt.Errorf("Failed to put to world state. %s", err.Error())
	// }
	// err = ctx.GetStub().PutState("SECURITYCONTROLCOUNT", []byte(strconv.Itoa(0)))
	// if err != nil {
	// 	return fmt.Errorf("Failed to put to world state. %s", err.Error())
	// }

	// IndexKey, err := ctx.GetStub().CreateCompositeKey(index, []string{risk.RiskName, risk.Organization.Orgname, strconv.Itoa(risk.Assessment.AssessId)})
	// value := []byte{0x00}
	// err = ctx.GetStub().PutState(IndexKey, value)
	return nil

}

// -----------------------------------------------------------------------ASSESSMENT FUNCTIONS-------------------------------------------------------------------------------------------------

func (s *SmartContract) AssessRisk(ctx contractapi.TransactionContextInterface, uuid string, rname string, description string, acc float32, like float32, imp float32, aid int, atime string) error {
	// if !CheckAccess(ctx, "role", "RiskManager") {
	// 	fmt.Println("Access Denied")
	// 	return nil
	// }
	info := GetUserInfo(ctx)
	// check if risk exists
	// var risks []*Risk
	// risks, err := s.QueryRiskByName(ctx, rname)
	// if err != nil {
	// 	return fmt.Errorf("Failed to read from world state. %s", err.Error())
	// }
	// risks, err = QueryRisks(ctx, `{"selector":{"riskname":"`+rname+`","rorganization.suborgname":"`+info[1]+`"}}`)
	// if len(risks) < 1 {
// ---------------------------
	// riskCountBytes, err := ctx.GetStub().GetState("RISKCOUNT")
	// if err != nil {
	// 	return fmt.Errorf("Failed to read from world state. %s", err.Error())
	// }

	// if riskCountBytes == nil {
	// 	return fmt.Errorf("%s does not exist", "RISKCOUNT")
	// }
	// riskCount, _ := strconv.Atoi(string(riskCountBytes))
	// riskCount = riskCount + 1
// -------------------
	risk := Risk{
		RiskId:       "RISK" + uuid,
		Name:         rname,
		Description:  description,
		Likelihood:   float32(int(like*100)) / 100,
		Impact:       float32(int(imp*100)) / 100,
		Owner:        Organization{Orgname: info[2], SubOrgname: info[1]},
		Status:       GetRiskStatus(like, imp, acc),
		Acceptance:   acc,
		Value:        float32(int(like*imp*100)) / 100,
		Time:         atime,
		Organization: Organization{Orgname: info[2], SubOrgname: info[1]},
		Assessment:   Assessment{AssessId: aid, RiskManager: info[0]},
	}

	riskasBytes, _ := json.Marshal(risk)

	// err = ctx.GetStub().PutState("RISK"+risk.RiskId, riskasBytes)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), risk.RiskId, riskasBytes)
	// h := sha256.Sum256([]byte("risk"))
	// hashkey:=string(h[:])
	// err = ctx.GetStub().PutState(hashkey, riskasBytes)
	err = ctx.GetStub().PutState(risk.Organization.Orgname+risk.RiskId+risk.Name, riskasBytes)
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}
	payload := string(riskasBytes)
	ctx.GetStub().SetEvent("Risk", []byte(payload))
	// err = ctx.GetStub().PutState("RISKCOUNT", []byte(strconv.Itoa(riskCount)))
	// if err != nil {
	// 	return fmt.Errorf("Failed to put to world state. %s", err.Error())
	// }
	// IndexKey, err := ctx.GetStub().CreateCompositeKey(index, []string{risk.RiskName, risk.Organization.Orgname, strconv.Itoa(risk.Assessment.AssessId)})
	// value := []byte{0x00}
	// err = ctx.GetStub().PutState(IndexKey, value)
	return nil
	// } else {
	// risk := risks[1]
	// risk.Owner.Orgname = info[2]
	// risk.Owner.SubOrgname = info[1]
	// risk.Likelihood = like
	// risk.Impact = imp
	// risk.Status = GetRiskStatus(like, imp, acc)
	// risk.Acceptance = acc
	// risk.Organization.Orgname = info[2]
	// risk.Organization.SubOrgname = info[1]
	// risk.Assessment.AssessId = aid
	// risk.Assessment.RiskManager = info[0]
	// risk.Assessment.Date = "now"
	// riskasBytes, _ := json.Marshal(risk)
	// err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), "RISK"+risk.RiskId, riskasBytes)
	// if err != nil {
	// 	return fmt.Errorf("Failed to put to world state. %s", err.Error())
	// }
	// 	return fmt.Errorf("Risk already exists, please update the previous one or change its name")
	// }
}
func (s *SmartContract) EditRisk(ctx contractapi.TransactionContextInterface, riskid string, description string, rname string, acc float32, like float32, imp float32, val float32, aid int, orgn string, subn string) error {
	// if !CheckAccess(ctx, "role", "RiskManager") {
	// 	fmt.Println("Access Denied")
	// 	return nil
	// }
	info := GetUserInfo(ctx)
	// var r *Risk
	// r, _ = s.QueryRisk(ctx, riskid)

	// if r == nil {
	// 	return fmt.Errorf("Risk does not exist.")
	// }
	risk := Risk{
		RiskId:       riskid,
		Name:         rname,
		Description:  description,
		Likelihood:   float32(int(like*100)) / 100,
		Impact:       float32(int(imp*100)) / 100,
		Owner:        Organization{Orgname: orgn, SubOrgname: subn},
		Status:       GetRiskStatus(like, imp, acc),
		Acceptance:   acc,
		Value:        val,
		Organization: Organization{Orgname: info[2], SubOrgname: info[1]},
		Assessment:   Assessment{AssessId: aid, RiskManager: info[0]},
	}

	riskasBytes, _ := json.Marshal(risk)

	// err = ctx.GetStub().PutState("RISK"+risk.RiskId, riskasBytes)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), riskid, riskasBytes)
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}
	payload := string(riskasBytes)
	ctx.GetStub().SetEvent("Risk", []byte(payload))
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	return nil

}
func (s *SmartContract) DeleteRisk(ctx contractapi.TransactionContextInterface, riskid string) error {
	info := GetUserInfo(ctx)
	err := ctx.GetStub().DelPrivateData(strings.ReplaceAll(info[2], ".", "-"), riskid)
	payload := "Risk Successfully Deleted "
	ctx.GetStub().SetEvent("Risk", []byte(payload))

	return err
}

func GetRiskStatus(like float32, imp float32, accept float32) string {
	if imp*like <= accept {
		return "Mitigated"
	} else {
		return "Active"
	}
}

// func riskdepstruct(riskdeps string) []RiskDep {
// 	var riskdep []string
// 	riskdep = strings.Split(riskdeps, ";")
// 	var riskdepstostruct []RiskDep
// 	for _, rdeps := range riskdep {
// 		rdep := strings.Split(rdeps, ":")
// 		if len(rdep) < 4 {
// 			break
// 		}
// 		imp, _ := strconv.ParseFloat(rdep[2], 32)
// 		like, _ := strconv.ParseFloat(rdep[3], 32)
// 		rd := RiskDep{RiskId: rdep[0], RiskName: rdep[1], Impact: float32(imp), Likelihood: float32(like)}
// 		riskdepstostruct = append(riskdepstostruct, rd)
// 	}
// 	return riskdepstostruct
// }
func riskdepstruct(riskdeps string) []RiskDep {
	bytes := []byte(riskdeps)
	var deps []RiskDep
	_ = json.Unmarshal(bytes, &deps)
	return deps
}

// func scdepstostruct(scdeps string) []SCDep {
// 	var scdep []string
// 	scdep = strings.Split(scdeps, ",")
// 	var scdepstostruct []SCDep
// 	for _, scd := range scdep {
// 		sc := SCDep{SecurityControlId: scd}
// 		scdepstostruct = append(scdepstostruct, sc)
// 	}
// 	return scdepstostruct
// }
func scdepstostruct(scdeps string) []SCDep {
	bytes := []byte(scdeps)
	var deps []SCDep
	_ = json.Unmarshal(bytes, &deps)
	return deps
}
func (s *SmartContract) CreateMitigation(ctx contractapi.TransactionContextInterface, uuid string, mitigation string, description string, avresponsible string, time string, riskdeps string) error {
	// if !CheckAccess(ctx, "role", "RiskManager") {
	// 	fmt.Println("Access Denied")
	// 	return nil
	// }

	// ***check if already av****
	// var mitigations []*Mitigation
	// mitigations, err := s.QueryMitigationByName(ctx, mitigation)
	// if err != nil {
	// 	return fmt.Errorf("Failed to read from world state. %s", err.Error())
	// }
	// // risks, err := QueryRisks(ctx, `{"selector":{"riskname":"`+rname+`","rorganization.suborgname":"`+info[1]+`"}}`)
	// if len(mitigations) < 1 {
	emptyscdep := make([]SCDep, 0)
	info := GetUserInfo(ctx)
	// mitigationCountBytes, err := ctx.GetStub().GetState("MITIGATIONCOUNT")
	// if err != nil {
	// 	return fmt.Errorf("Failed to read from world state. %s", err.Error())
	// }

	// if mitigationCountBytes == nil {
	// 	return fmt.Errorf("%s does not exist", "MITIGATIONCOUNT")
	// }
	// mitigationCount, _ := strconv.Atoi(string(mitigationCountBytes))
	// mitigationCount = mitigationCount + 1

	m := Mitigation{
		MitigationId: "MITIGATION" + uuid,
		Name:         mitigation,
		Description:  description,
		Status:       "PENDING",
		// ApplyResponsible:   apresponsible,
		ApproveResponsible: avresponsible,
		Organization:       Organization{Orgname: info[2], SubOrgname: info[1]},
		RiskDeps:           riskdepstruct(riskdeps),
		SCDeps:             emptyscdep,
	}
	mitasBytes, _ := json.Marshal(m)

	// err := ctx.GetStub().PutState("MITIGATION"+strconv.Itoa(mitigationCount), mitasBytes)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), m.MitigationId, mitasBytes)
	err = ctx.GetStub().PutState(m.Organization.Orgname+m.MitigationId+m.Name, mitasBytes)
	payload := string(mitasBytes)
	err = ctx.GetStub().SetEvent("Mitigation", []byte(payload))
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}
	// err = ctx.GetStub().PutState("MITIGATIONCOUNT", []byte(strconv.Itoa(mitigationCount)))
	// if err != nil {
	// 	return fmt.Errorf("Failed to put to world state. %s", err.Error())
	// }
	// IndexKey, err := ctx.GetStub().CreateCompositeKey(index, []string{strconv.Itoa(risk.RiskId)})
	// IndexKey, err := ctx.GetStub().CreateCompositeKey(index, []string{risk.RiskName, risk.Organization.Orgname, strconv.Itoa(risk.Assessment.AssessId)})
	// value := []byte{0x00}
	// err = ctx.GetStub().PutState(IndexKey, value)
	return nil
	// } else {
	// 	return fmt.Errorf("Mitigation already exists, please update the existing one or change its name")

	// 	return nil
	// }
}
func (s *SmartContract) CreateRiskDependencies(ctx contractapi.TransactionContextInterface, mid string, rid string, likelihood float32, impact float32) error {
	info := GetUserInfo(ctx)
	var mi *Mitigation
	mi, _ = s.QueryMitigation(ctx, mid)
	if mi == nil {
		return fmt.Errorf("Mitigation does not exist.")
	}
	//
	riskdep := RiskDep{
		RiskId:     rid,
		Likelihood: float32(int(likelihood*100)) / 100,
		Impact:     float32(int(impact*100)) / 100,
	}
	mi.RiskDeps = append(mi.RiskDeps, riskdep)
	mitasBytes, _ := json.Marshal(mi)

	// err := ctx.GetStub().PutState("MITIGATION"+strconv.Itoa(mitigationCount), mitasBytes)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), mi.MitigationId, mitasBytes)
	return err
}
func (s *SmartContract) EditMitigation(ctx contractapi.TransactionContextInterface, mid string, mitigation string, description string, avresponsible string, time string, riskdeps string) error {
	// if !CheckAccess(ctx, "role", "RiskManager") {
	// 	fmt.Println("Access Denied")
	// 	return nil
	// }

	// ***check if already av****
	var mi *Mitigation
	mi, _ = s.QueryMitigation(ctx, mid)
	if mi == nil {
		return fmt.Errorf("Mitigation does not exist.")
	}
	// // risks, err := QueryRisks(ctx, `{"selector":{"riskname":"`+rname+`","rorganization.suborgname":"`+info[1]+`"}}`)
	// if len(mitigations) < 1 {
	emptyscdep := make([]SCDep, 0)
	info := GetUserInfo(ctx)
	m := Mitigation{
		MitigationId: mid,
		Name:         mitigation,
		Description:  description,
		Status:       "PENDING",
		// ApplyResponsible:   apresponsible,
		ApproveResponsible: avresponsible,
		Organization:       Organization{Orgname: info[2], SubOrgname: info[1]},
		RiskDeps:           riskdepstruct(riskdeps),
		SCDeps:             emptyscdep,
	}
	mitasBytes, _ := json.Marshal(m)

	// err := ctx.GetStub().PutState("MITIGATION"+strconv.Itoa(mitigationCount), mitasBytes)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), m.MitigationId, mitasBytes)
	err = ctx.GetStub().PutState(m.Organization.Orgname+m.MitigationId+m.Name, mitasBytes)
	payload := string(mitasBytes)
	err = ctx.GetStub().SetEvent("Mitigation", []byte(payload))
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}
	// IndexKey, err := ctx.GetStub().CreateCompositeKey(index, []string{strconv.Itoa(risk.RiskId)})
	// IndexKey, err := ctx.GetStub().CreateCompositeKey(index, []string{risk.RiskName, risk.Organization.Orgname, strconv.Itoa(risk.Assessment.AssessId)})
	// value := []byte{0x00}
	// err = ctx.GetStub().PutState(IndexKey, value)
	return nil
	// } else {
	// 	return fmt.Errorf("Mitigation already exists, please update the existing one or change its name")

	// 	return nil
	// }
}
func (s *SmartContract) DeleteMitigation(ctx contractapi.TransactionContextInterface, mid string) error {
	info := GetUserInfo(ctx)
	mitigationBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), mid)
	if err != nil {
		return fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if mitigationBytes == nil {
		return fmt.Errorf("%s does not exist", mid)
	}
	mitigation := new(Mitigation)
	_ = json.Unmarshal(mitigationBytes, mitigation)
	if len(mitigation.SCDeps) > 0 {
		s.DeleteSubSecurityControl(ctx, mitigation.SCDeps)
	}
	ctx.GetStub().DelPrivateData(strings.ReplaceAll(info[2], ".", "-"), mid)
	payload := "Mitigation Successfully Deleted "
	ctx.GetStub().SetEvent("Mitigation", []byte(payload))
	return nil

}

func (s *SmartContract) CreateSecurityControl(ctx contractapi.TransactionContextInterface, uuid string, scname string, desc string, applier string, supid string, mid string) error {
	emptyscdep := make([]SCDep, 0)
	info := GetUserInfo(ctx)
	// var scs []*SecurityControl
	// scs, err := s.QuerySecurityControlByName(ctx, scname)
	// if err != nil {
	// 	return fmt.Errorf("Failed to read from world state. %s", err.Error())
	// }
	// risks, err := QueryRisks(ctx, `{"selector":{"riskname":"`+rname+`","rorganization.suborgname":"`+info[1]+`"}}`)
	// if len(scs) < 1 {

	// securitycontrolCountBytes, _ := ctx.GetStub().GetState("SECURITYCONTROLCOUNT")
	// securitycontrolCount, _ := strconv.Atoi(string(securitycontrolCountBytes))
	// securitycontrolCount = securitycontrolCount + 1
	sc := SecurityControl{
		SecuritycontrolId: "SECURITYCONTROL" + uuid,
		Name:              scname,
		Description:       desc,
		ApplyResponsible:  applier,
		SupScId:           supid,
		MitigationId:      mid,
		Organization:      Organization{Orgname: info[2], SubOrgname: info[1]},
		Status:            "PENDING",
		SCDeps:            emptyscdep,
	}
	scasBytes, _ := json.Marshal(sc)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), sc.SecuritycontrolId, scasBytes)
	err = ctx.GetStub().PutState(sc.Organization.Orgname+sc.SecuritycontrolId+sc.Name, scasBytes)
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	// err := ctx.GetStub().PutState("SECURITYCONTROL"+sc.SecuritycontrolId, scasBytes)
	// err = ctx.GetStub().PutState("SECURITYCONTROLCOUNT", []byte(strconv.Itoa(securitycontrolCount)))
	// if err != nil {
	// 	return fmt.Errorf("Failed to put to world state. %s", err.Error())
	// }
	if mid != "" {
		mitigationBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), mid)
		if err != nil {
			return fmt.Errorf("Failed to read from world state. %s", err.Error())
		}

		if mitigationBytes == nil {
			return fmt.Errorf("%s does not exist", mid)
		}
		mitigation := new(Mitigation)
		_ = json.Unmarshal(mitigationBytes, mitigation)
		mitigation.SCDeps = append(mitigation.SCDeps, SCDep{SecurityControlId: sc.SecuritycontrolId})
		//write
		mitasBytes, _ := json.Marshal(mitigation)
		err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitigation.MitigationId, mitasBytes)
		if err != nil {
			return fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
	} else {
		supBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), supid)
		if err != nil {
			return fmt.Errorf("Failed to read from world state. %s", err.Error())
		}

		if supBytes == nil {
			return fmt.Errorf("%s does not exist", supid)
		}
		sup := new(SecurityControl)
		_ = json.Unmarshal(supBytes, sup)
		sup.SCDeps = append(sup.SCDeps, SCDep{SecurityControlId: "SECURITYCONTROL" + sc.SecuritycontrolId})
		//write
		supBytes, _ = json.Marshal(sup)
		err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), sup.SecuritycontrolId, supBytes)
		if err != nil {
			return fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
	}
	payload := string(scasBytes)
	ctx.GetStub().SetEvent("SecurityControl", []byte(payload))
	return err
	// } else {
	// 	return fmt.Errorf("Security Control Already exists, please update the existing one or modify its name")
	// }
}
func FindSCDep(scdeps []SCDep, scid string) int {
	// var scdep SCDep
	for i, scdep := range scdeps {
		if scdep.SecurityControlId == scid {
			return i
		}
	}
	return -1
}
func (s *SmartContract) EditSecurityControl(ctx contractapi.TransactionContextInterface, sid string, scname string, desc string, applier string, supid string, mid string) error {
	emptyscdep := make([]SCDep, 0)
	info := GetUserInfo(ctx)
	// var scs []*SecurityControl
	// scs, err := s.QuerySecurityControlByName(ctx, scname)
	// if err != nil {
	// 	return fmt.Errorf("Failed to read from world state. %s", err.Error())
	// }
	// risks, err := QueryRisks(ctx, `{"selector":{"riskname":"`+rname+`","rorganization.suborgname":"`+info[1]+`"}}`)
	// if len(scs) < 1 {

	sc := SecurityControl{
		SecuritycontrolId: sid,
		Name:              scname,
		Description:       desc,
		ApplyResponsible:  applier,
		SupScId:           supid,
		MitigationId:      mid,
		Organization:      Organization{Orgname: info[2], SubOrgname: info[1]},
		Status:            "PENDING",
		SCDeps:            emptyscdep,
	}
	scasBytes, _ := json.Marshal(sc)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), sc.SecuritycontrolId, scasBytes)
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	// err := ctx.GetStub().PutState("SECURITYCONTROL"+sc.SecuritycontrolId, scasBytes)
	return err
	// } else {
	// 	return fmt.Errorf("Security Control Already exists, please update the existing one or modify its name")
	// }
}
func (s *SmartContract) DeleteSubSecurityControl(ctx contractapi.TransactionContextInterface, scdeps []SCDep) error {
	info := GetUserInfo(ctx)
	if len(scdeps) > 0 {
		for _, scdep := range scdeps {
			scBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), scdep.SecurityControlId)
			if err != nil {
				return fmt.Errorf("Failed to read from world state. %s", err.Error())
			}

			if scBytes == nil {
				return fmt.Errorf("%s does not exist", scdep.SecurityControlId)
			}
			sc := new(SecurityControl)
			_ = json.Unmarshal(scBytes, sc)
			if len(sc.SCDeps) > 0 {
				s.DeleteSubSecurityControl(ctx, sc.SCDeps)
			}
			ctx.GetStub().DelPrivateData(strings.ReplaceAll(info[2], ".", "-"), scdep.SecurityControlId)
		}
	}

	return nil
}
func (s *SmartContract) DeleteSecurityControl(ctx contractapi.TransactionContextInterface, scid string) error {
	info := GetUserInfo(ctx)
	scBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), scid)
	if err != nil {
		return fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if scBytes == nil {
		return fmt.Errorf("%s does not exist", scid)
	}
	sc := new(SecurityControl)
	_ = json.Unmarshal(scBytes, sc)
	if len(sc.SCDeps) > 0 {
		for _, scdep := range sc.SCDeps {
			ctx.GetStub().DelPrivateData(strings.ReplaceAll(info[2], ".", "-"), scdep.SecurityControlId)
		}
	}
	if len(sc.SupScId) == 0 {
		mitigationBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), sc.MitigationId)
		if err != nil {
			return fmt.Errorf("Failed to read from world state. %s", err.Error())
		}

		if mitigationBytes == nil {
			return fmt.Errorf("%s does not exist", sc.MitigationId)
		}
		mitigation := new(Mitigation)
		_ = json.Unmarshal(mitigationBytes, mitigation)
		i := FindSCDep(mitigation.SCDeps, scid)
		if i >= 0 {
			mitigation.SCDeps = append(mitigation.SCDeps[:i], mitigation.SCDeps[i+1:]...)
		}
		//write
		mitasBytes, _ := json.Marshal(mitigation)
		err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitigation.MitigationId, mitasBytes)
		if err != nil {
			return fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

	} else {
		spBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), sc.SupScId)
		if err != nil {
			return fmt.Errorf("Failed to read from world state. %s", err.Error())
		}

		if spBytes == nil {
			return fmt.Errorf("%s does not exist", sc.SupScId)
		}
		sp := new(SecurityControl)
		_ = json.Unmarshal(spBytes, sp)
		i := FindSCDep(sp.SCDeps, scid)
		if i >= 0 {
			sp.SCDeps = append(sc.SCDeps[:i], sp.SCDeps[i+1:]...)
		}
		//write
		spasBytes, _ := json.Marshal(sp)
		err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), sp.SecuritycontrolId, spasBytes)
		if err != nil {
			return fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
	}

	err = ctx.GetStub().DelPrivateData(strings.ReplaceAll(info[2], ".", "-"), scid)
	payload := "Security Control Successfully Deleted ."
	ctx.GetStub().SetEvent("SecurityControl", []byte(payload))
	return err
}
func (s *SmartContract) QuerySecurityControl(ctx contractapi.TransactionContextInterface, scid string) (*SecurityControl, error) {
	info := GetUserInfo(ctx)
	scAsBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), scid)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if scAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", scid)
	}
	// scAsBytes, err := ctx.GetStub().GetState(scid)

	sc := new(SecurityControl)
	_ = json.Unmarshal(scAsBytes, sc)

	return sc, nil
}
func (s *SmartContract) TransferRisk(ctx contractapi.TransactionContextInterface, riskid string, newinfo []string) error {
	//checking Access
	// if !CheckAccess(ctx, "role", "RiskManager") {
	// 	fmt.Println("Access Denied")
	// 	return nil
	// }
	info := GetUserInfo(ctx)
	riskBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), riskid)
	if err != nil {
		return fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if riskBytes == nil {
		return fmt.Errorf("%s does not exist", riskid)
	}
	risk := new(Risk)
	_ = json.Unmarshal(riskBytes, risk)
	risk.Owner.Orgname = newinfo[2]
	risk.Owner.SubOrgname = newinfo[1]
	risk.Status = "Active, Transferred"
	riskBytes, _ = json.Marshal(risk)
	// err = ctx.GetStub().PutState(riskid, riskBytes)
	err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(newinfo[2], ".", "-"), riskid, riskBytes)
	err = ctx.GetStub().PutState(risk.Organization.Orgname+risk.RiskId+risk.Name, riskBytes)

	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), riskid, riskBytes)
	// err = ctx.GetStub().PutState(risk.Organization.Orgname+risk.RiskId+risk.Name, riskBytes)
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}
	payload := string(riskBytes)
	ctx.GetStub().SetEvent("Risk", []byte(payload))
	return err
}
func (s *SmartContract) ChangeSecurityControlApplier(ctx contractapi.TransactionContextInterface, scid string, newapplier string) error {
	//checking Access
	// if !CheckAccess(ctx, "role", "RiskManager") {
	// 	fmt.Println("Access Denied")
	// 	return nil
	// }
	info := GetUserInfo(ctx)
	scBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), scid)
	if err != nil {
		return fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if scBytes == nil {
		return fmt.Errorf("%s does not exist", scid)
	}
	sc := new(SecurityControl)
	_ = json.Unmarshal(scBytes, sc)
	sc.ApplyResponsible = newapplier
	scBytes, _ = json.Marshal(sc)
	// err = ctx.GetStub().PutState(mitid, mitigationBytes)
	err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), scid, scBytes)
	err = ctx.GetStub().PutState(sc.Organization.Orgname+sc.SecuritycontrolId+sc.Name, scBytes)
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}
	payload := string(scBytes)
	ctx.GetStub().SetEvent("SecurityControl", []byte(payload))
	return err
}
func (s *SmartContract) ChangeMitigationApprover(ctx contractapi.TransactionContextInterface, mitid string, newapprover string) error {
	//checking Access
	// if !CheckAccess(ctx, "role", "RiskManager") {
	// 	fmt.Println("Access Denied")
	// 	return nil
	// }
	info := GetUserInfo(ctx)
	mitigationBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitid)
	if err != nil {
		return fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if mitigationBytes == nil {
		return fmt.Errorf("%s does not exist", mitid)
	}
	mitigation := new(Mitigation)
	_ = json.Unmarshal(mitigationBytes, mitigation)
	mitigation.ApproveResponsible = newapprover
	mitigationBytes, _ = json.Marshal(mitigation)
	// err = ctx.GetStub().PutState(mitid, mitigationBytes)
	err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitid, mitigationBytes)
	err = ctx.GetStub().PutState(mitigation.Organization.Orgname+mitigation.MitigationId+mitigation.Name, mitigationBytes)
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}
	payload := string(mitigationBytes)
	ctx.GetStub().SetEvent("Mitigation", []byte(payload))
	return err
}

func (s *SmartContract) CheckSecurityControlStatus(ctx contractapi.TransactionContextInterface, scid string, subid string) error {
	info := GetUserInfo(ctx)
	scBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), scid)
	if err != nil {
		return fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if scBytes == nil {
		return fmt.Errorf("%s does not exist", scid)
	}
	sc := new(SecurityControl)
	_ = json.Unmarshal(scBytes, sc)
	if len(sc.SCDeps) != 0 {
		if s.CheckSCDeps(ctx, sc.SCDeps, subid) {
			sc.Status = "APPLIED"
			scBytes, _ = json.Marshal(sc)
			err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), scid, scBytes)
			if err != nil {
				return fmt.Errorf("Failed to put to world state. %s", err.Error())
			}
			return s.CheckMitigationStatus(ctx, sc.MitigationId, subid)
		}
	}

	return err
}
func (s *SmartContract) CheckMitigationStatus(ctx contractapi.TransactionContextInterface, mid string, subid string) error {
	info := GetUserInfo(ctx)
	mitigationBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), mid)
	if err != nil {
		return fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if mitigationBytes == nil {
		return fmt.Errorf("%s does not exist", mid)
	}

	mitigation := new(Mitigation)
	_ = json.Unmarshal(mitigationBytes, mitigation)
	if mitigation.Status == "APPLIED" {
		return fmt.Errorf("Mitigation already Applied")
	}
	if s.CheckSCDeps(ctx, mitigation.SCDeps, subid) {
		mitigation.Status = "APPLIED"
		mitigationBytes, _ = json.Marshal(mitigation)
		// err = ctx.GetStub().PutState(mitid, mitigationBytes)
		err = ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), mid, mitigationBytes)
		if err != nil {
			return fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
	}
	return err
}
func (s *SmartContract) CheckSCDeps(ctx contractapi.TransactionContextInterface, ScDeps []SCDep, subid string) bool {
	info := GetUserInfo(ctx)
	for _, scdep := range ScDeps {
		if scdep.SecurityControlId == subid {
			continue
		} else {
			scdepBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), scdep.SecurityControlId)
			if err != nil {
				return false
			}
			sct := new(SecurityControl)
			_ = json.Unmarshal(scdepBytes, sct)
			if sct.Status != "APPLIED" {
				return false
			}
		}
	}

	return true
}
func (s *SmartContract) RecalculateRisks(ctx contractapi.TransactionContextInterface, rdeps []RiskDep) error {
	info := GetUserInfo(ctx)
	var riskdep RiskDep
	for _, riskdep = range rdeps {
		riskasBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), riskdep.RiskId)
		if err != nil {
			return fmt.Errorf("Failed to read from world state. %s", err.Error())
		}

		if riskasBytes == nil {
			return fmt.Errorf("%s does not exist", riskdep.RiskId)
		}
		risk := new(Risk)
		_ = json.Unmarshal(riskasBytes, risk)
		risk.Likelihood = float32(int((risk.Likelihood-riskdep.Likelihood)*100)) / 100
		risk.Impact = float32(int((risk.Impact-riskdep.Impact)*100)) / 100
		risk.Value = float32(int((risk.Likelihood*risk.Impact)*100)) / 100
		risk.Status = GetRiskStatus(risk.Likelihood, risk.Impact, risk.Acceptance)
		riskasBytes, _ = json.Marshal(risk)
		ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), riskdep.RiskId, riskasBytes)

		if err != nil {
			return fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		if err != nil {
			return fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		if risk.Owner.Orgname != risk.Organization.Orgname {
			ctx.GetStub().PutPrivateData(strings.ReplaceAll(risk.Organization.Orgname, ".", "-"), riskdep.RiskId, riskasBytes)

		}
		err = ctx.GetStub().PutState(risk.Organization.Orgname+risk.RiskId+risk.Name, riskasBytes)
	}
	return nil
}

// -----------------------------------------------------------------------RISK QUERIES-------------------------------------------------------------------------------------------------

func (s *SmartContract) QueryRisk(ctx contractapi.TransactionContextInterface, riskId string) (*Risk, error) {
	info := GetUserInfo(ctx)
	riskAsBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), riskId)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if riskAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", riskId)
	}

	risk := new(Risk)
	_ = json.Unmarshal(riskAsBytes, risk)

	return risk, nil
}
func (s *SmartContract) GetRisksByRange(ctx contractapi.TransactionContextInterface, startKey string, endKey string) ([]*Risk, error) {
	info := GetUserInfo(ctx)
	resultsIterator, err := ctx.GetStub().GetPrivateDataByRange(strings.ReplaceAll(info[2], ".", "-"), startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []*Risk{}

	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var risk *Risk
		err = json.Unmarshal(response.Value, &risk)
		// if err != nil {
		// 	return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
		// }
		if strings.Contains(risk.RiskId, "RISK") {
			results = append(results, risk)
		}
	}

	return results, nil

}
func (s *SmartContract) MonitorRisksByRange(ctx contractapi.TransactionContextInterface, startKey string, endKey string, orgcol string) ([]*Risk, error) {
	resultsIterator, err := ctx.GetStub().GetPrivateDataByRange(orgcol, startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []*Risk{}

	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var risk *Risk
		err = json.Unmarshal(response.Value, &risk)
		// if err != nil {
		// 	return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
		// }
		if strings.Contains(risk.RiskId, "RISK") {
			results = append(results, risk)
		}
	}

	return results, nil

}
func (t *SmartContract) QueryRiskByName(ctx contractapi.TransactionContextInterface, rname string) ([]*Risk, error) {
	queryString := `{"selector":{"rname":"` + rname + `"},"use_index":["indexRisk","indexRisk"]}`
	return getQueryResultForQueryString(ctx, queryString)
}
func QueryRisks(ctx contractapi.TransactionContextInterface, queryString string) ([]*Risk, error) {
	return getQueryResultForQueryString(ctx, queryString)
}
func (t *SmartContract) QueryRisksBySubOrg(ctx contractapi.TransactionContextInterface) ([]*Risk, error) {
	info := GetUserInfo(ctx)
	// "{\"selector\":{\"docType\":\"asset\",\"owner\":\"tom\"}, \"use_index\":[\"_design/indexOwnerDoc\", \"indexOwner\"]}"]}'
	queryString := `{"selector":{"ownerorg.suborgname":"` + info[1] + `"},"use_index":["indexRisk","indexRisk"]}`
	return getQueryResultForQueryString(ctx, queryString)
}
func (t *SmartContract) QueryRisksByUserOwnerOrg(ctx contractapi.TransactionContextInterface) ([]*Risk, error) {
	info := GetUserInfo(ctx)
	queryString := `{"selector":{"ownerorg.orgname":"` + info[2] + `"},"use_index":["indexRisk","indexRisk"]}`
	return getQueryResultForQueryString(ctx, queryString)
}
func (t *SmartContract) QueryRisksByRiskManager(ctx contractapi.TransactionContextInterface) ([]*Risk, error) {
	info := GetUserInfo(ctx)
	queryString := `{"selector":{"assessment.RiskManager":"` + info[0] + `"},"use_index":["indexRisk","indexRisk"]}`
	return getQueryResultForQueryString(ctx, queryString)
}
func (t *SmartContract) QueryRisksByAssessment(ctx contractapi.TransactionContextInterface, assessid string) ([]*Risk, error) {
	queryString := `{"selector":{"assessment.aid":"` + assessid + `"},"use_index":["indexRisk","indexRisk"]}`
	return getQueryResultForQueryString(ctx, queryString)
}

func getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*Risk, error) {
	info := GetUserInfo(ctx)
	resultsIterator, err := ctx.GetStub().GetPrivateDataQueryResult(strings.ReplaceAll(info[2], ".", "-"), queryString)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	return constructQueryResponseFromIterator(resultsIterator)
}
func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*Risk, error) {
	var assets []*Risk
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset Risk
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		if strings.Contains(asset.RiskId, "RISK") {
			assets = append(assets, &asset)
		}
	}

	return assets, nil
}

// func (t *SmartContract) GetRisksByRangeWithPagination(ctx contractapi.TransactionContextInterface, startKey string, endKey string, pageSize int, bookmark string) ([]*Risk, error) {

// 	resultsIterator, _, err := ctx.GetStub().GetStateByRangeWithPagination(startKey, endKey, int32(pageSize), bookmark)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer resultsIterator.Close()

// 	return constructQueryResponseFromIterator(resultsIterator)
// }

// func getQueryResultForQueryStringWithPagination(ctx contractapi.TransactionContextInterface, queryString string, pageSize int32, bookmark string) (*PaginatedQueryResult, error) {

// 	resultsIterator, responseMetadata, err := ctx.GetStub().GetQueryResultWithPagination(queryString, pageSize, bookmark)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer resultsIterator.Close()

// 	assets, err := constructQueryResponseFromIterator(resultsIterator)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &PaginatedQueryResult{
// 		Records:             assets,
// 		FetchedRecordsCount: responseMetadata.FetchedRecordsCount,
// 		Bookmark:            responseMetadata.Bookmark,
// 	}, nil
// }

func (t *SmartContract) GetRiskHistory(ctx contractapi.TransactionContextInterface, riskId string) ([]HistoryQueryRiskResult, error) {
	info := GetUserInfo(ctx)
	riskasBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), riskId)
	// log.Printf("GetRiskHistory: ID %v", riskId)
	if err != nil {
		return nil, err
	}
	risk := new(Risk)
	_ = json.Unmarshal(riskasBytes, risk)
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(risk.Owner.Orgname + risk.RiskId + risk.Name)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []HistoryQueryRiskResult
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var risk Risk
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &risk)
			if err != nil {
				return nil, err
			}
		} else {
			risk = Risk{}
		}

		timestamp, err := ptypes.Timestamp(response.Timestamp)
		if err != nil {
			return nil, err
		}

		record := HistoryQueryRiskResult{
			TxId:      response.TxId,
			Timestamp: timestamp,
			Record:    &risk,
			IsDelete:  response.IsDelete,
		}
		records = append(records, record)
	}

	return records, nil
}
func (t *SmartContract) GetRiskHistory1(ctx contractapi.TransactionContextInterface, riskId string) ([]HistoryQueryRiskResult, error) {
	// info := GetUserInfo(ctx)
	// riskasBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), riskId)
	// // log.Printf("GetRiskHistory: ID %v", riskId)
	// if err != nil {
	// 	return nil, err
	// }
	// risk := new(Risk)
	// _ = json.Unmarshal(riskasBytes, risk)
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(riskId)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []HistoryQueryRiskResult
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var risk Risk
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &risk)
			if err != nil {
				return nil, err
			}
		} else {
			risk = Risk{}
		}

		timestamp, err := ptypes.Timestamp(response.Timestamp)
		if err != nil {
			return nil, err
		}

		record := HistoryQueryRiskResult{
			TxId:      response.TxId,
			Timestamp: timestamp,
			Record:    &risk,
			IsDelete:  response.IsDelete,
		}
		records = append(records, record)
	}

	return records, nil
}

// // -----------------------------------------------------------------------MITIGATION FUNCTIONS-------------------------------------------------------------------------------------------------

// -----------------------------------------------------------------------APPLY MITIGATION -------------------------------------------------------------------------------------------------

func (s *SmartContract) ApplyMitigation(ctx contractapi.TransactionContextInterface, mitigationid string) error {
	info := GetUserInfo(ctx)
	mitigationasBytes, _ := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitigationid)

	mitigation := new(Mitigation)

	_ = json.Unmarshal(mitigationasBytes, mitigation)

	if mitigation.Status == "APPLIED" {
		return fmt.Errorf("Mitgation Already Applied")
	}
	//check if mititgation responsible is the applier

	//
	mitigation.Status = "APPLIED"

	mitigationasBytes, _ = json.Marshal(mitigation)
	// err := ctx.GetStub().PutState(mitigationid, mitigationasBytes)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitigationid, mitigationasBytes)
	payload := string(mitigationasBytes)
	ctx.GetStub().SetEvent("Mitigation", []byte(payload))
	return err
}
func (s *SmartContract) ApplySecurityControl(ctx contractapi.TransactionContextInterface, scid string) error {
	info := GetUserInfo(ctx)
	scBytes, _ := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), scid)

	sc := new(SecurityControl)

	_ = json.Unmarshal(scBytes, sc)
	if sc.ApplyResponsible != info[0] {
		return fmt.Errorf("Access prohibted, user not allowed to apply securitycontrol")
	}
	if sc.Status == "APPLIED" {
		return fmt.Errorf("SecurityControl already Applied")
	}

	sc.Status = "APPLIED"

	scBytes, _ = json.Marshal(sc)
	// err := ctx.GetStub().PutState(mitigationid, mitigationasBytes)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), scid, scBytes)
	err = ctx.GetStub().PutState(sc.Organization.Orgname + sc.SecuritycontrolId + sc.Name, scBytes)
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	if len(sc.SupScId) < 1 {
		s.CheckMitigationStatus(ctx, sc.MitigationId, scid)
	} else {
		s.CheckSecurityControlStatus(ctx, sc.SupScId, scid)
	}
	payload := string(scBytes)
	ctx.GetStub().SetEvent("SecurityControl", []byte(payload))
	return err
}

// -----------------------------------------------------------------------APPROVE MITIGATION -------------------------------------------------------------------------------------------------
func (s *SmartContract) ApproveMitigation(ctx contractapi.TransactionContextInterface, mitigationid string) error {
	// if !CheckAccess(ctx, "role", "Approver") {
	// 	fmt.Println("Access Denied")
	// 	return nil
	// }
	info := GetUserInfo(ctx)
	mitigationasBytes, _ := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitigationid)
	// mitigationasBytes, _ := ctx.GetStub().GetState(mitigationid)

	mitigation := new(Mitigation)
	_ = json.Unmarshal(mitigationasBytes, mitigation)
	//check if mitigation approver is the approver
	if mitigation.ApproveResponsible != info[0] {
		return fmt.Errorf("Access prohibted, user not allowed to approve mitigation")
	}
	//
	if mitigation.Status == "APPROVED" {
		return fmt.Errorf("Mitigation already Approved")
	}
	if mitigation.Status == "PENDING" {
		return fmt.Errorf("Mitigation not Applied yet")
	}
	mitigation.Status = "APPROVED"

	mitigationasBytes, _ = json.Marshal(mitigation)
	// err := ctx.GetStub().PutState(mitigationid, mitigationasBytes)
	err := ctx.GetStub().PutPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitigationid, mitigationasBytes)
	err = ctx.GetStub().PutState(mitigation.Organization.Orgname+mitigation.MitigationId+mitigation.Name, mitigationasBytes)
	if err != nil {
		return fmt.Errorf("Failed to put to world state. %s", err.Error())
	}
	return s.RecalculateRisks(ctx, mitigation.RiskDeps)
	payload := string(mitigationasBytes)
	ctx.GetStub().SetEvent("Mitigation", []byte(payload))
	return err
}

// -----------------------------------------------------------------------QUERIES MITIGATION -------------------------------------------------------------------------------------------------

func (s *SmartContract) QueryMitigation(ctx contractapi.TransactionContextInterface, mitId string) (*Mitigation, error) {
	info := GetUserInfo(ctx)
	mitigationasBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitId)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if mitigationasBytes == nil {
		return nil, fmt.Errorf("%s does not exist", mitId)
	}

	mitigation := new(Mitigation)
	_ = json.Unmarshal(mitigationasBytes, mitigation)

	return mitigation, nil
}
func (s *SmartContract) GetMitigationsByRange(ctx contractapi.TransactionContextInterface, startKey string, endKey string) ([]*Mitigation, error) {
	info := GetUserInfo(ctx)
	resultsIterator, err := ctx.GetStub().GetPrivateDataByRange(strings.ReplaceAll(info[2], ".", "-"), startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []*Mitigation{}

	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var mitigation *Mitigation
		err = json.Unmarshal(response.Value, &mitigation)
		// if err != nil {
		// 	return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
		// }
		if strings.Contains(mitigation.MitigationId, "MITIGATION") {
			results = append(results, mitigation)
		}
	}
	// for resultsIterator.HasNext() {
	// 	response, err := resultsIterator.Next()
	// 	if err == nil {
	// 		var mitigation *Mitigation
	// 		err = json.Unmarshal(response.Value, &mitigation)
	// 		if err != nil {
	// 			return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
	// 		}

	// 		results = append(results, mitigation)
	// 	}
	// }

	return results, nil

}
func (s *SmartContract) MonitorMitigationsByRange(ctx contractapi.TransactionContextInterface, startKey string, endKey string, orgcol string) ([]*Mitigation, error) {
	resultsIterator, err := ctx.GetStub().GetPrivateDataByRange(orgcol, startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []*Mitigation{}

	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var mitigation *Mitigation
		err = json.Unmarshal(response.Value, &mitigation)
		// if err != nil {
		// 	return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
		// }
		if strings.Contains(mitigation.MitigationId, "MITIGATION") {
			results = append(results, mitigation)
		}
	}

	return results, nil

}
func (t *SmartContract) QueryMitigationByName(ctx contractapi.TransactionContextInterface, mname string) ([]*Mitigation, error) {
	queryString := `{"selector":{"mname":"` + mname + `"},"use_index":["indexMitigation","indexMitigation"]}`
	return getQueryResultForQueryStringMitigation(ctx, queryString)
}
func (t *SmartContract) QueryMitigations(ctx contractapi.TransactionContextInterface, queryString string) ([]*Mitigation, error) {
	return getQueryResultForQueryStringMitigation(ctx, queryString)
}
func (t *SmartContract) QueryMitigationsByApprover(ctx contractapi.TransactionContextInterface) ([]*Mitigation, error) {
	info := GetUserInfo(ctx)
	queryString := `{"selector":{"avresponsible":"` + info[0] + `"},"use_index":["indexMitigation","indexMitigation"]}`
	return getQueryResultForQueryStringMitigation(ctx, queryString)
}
func (t *SmartContract) QueryMitigationsBySubOrg(ctx contractapi.TransactionContextInterface) ([]*Mitigation, error) {
	info := GetUserInfo(ctx)
	queryString := `{"selector":{"morganization.suborgname":"` + info[1] + `"},"use_index":["indexMitigation","indexMitigation"]}`
	return getQueryResultForQueryStringMitigation(ctx, queryString)
}
func (t *SmartContract) QueryAppliedMitigations(ctx contractapi.TransactionContextInterface) ([]*Mitigation, error) {

	queryString := `{"selector":{"mstatus":"APPLIED"}},"use_index":["indexMitigation","indexMitigation"]}`
	return getQueryResultForQueryStringMitigation(ctx, queryString)
}
func (t *SmartContract) QueryApprovedMitigations(ctx contractapi.TransactionContextInterface) ([]*Mitigation, error) {

	queryString := `{"selector":{"mstatus":"APPROVED"}},"use_index":["indexMitigation","indexMitigation"]}`
	return getQueryResultForQueryStringMitigation(ctx, queryString)
}
func (t *SmartContract) QueryMitigationsByRiskId(ctx contractapi.TransactionContextInterface, rid string) ([]*Mitigation, error) {
	// info := GetUserInfo(ctx)
	queryString := `{"selector":{"riskdeps.[].rdid":"` + rid + `"},"use_index":["indexMitigation","indexMitigation"]}`
	return getQueryResultForQueryStringMitigation(ctx, queryString)
}

// func (t *SmartContract) QuerySecurityControlsByUserApply(ctx contractapi.TransactionContextInterface) ([]*Mitigation, error) {
// 	info := GetUserInfo(ctx)
// 	queryString := `{"selector":{"apresponsible":"` + info[0] + `"}}`
// 	return getQueryResultForQueryStringMitigation(ctx, queryString)
// }

func getQueryResultForQueryStringMitigation(ctx contractapi.TransactionContextInterface, queryString string) ([]*Mitigation, error) {
	info := GetUserInfo(ctx)
	resultsIterator, err := ctx.GetStub().GetPrivateDataQueryResult(strings.ReplaceAll(info[2], ".", "-"), queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	return constructQueryResponseFromIteratorMitigation(resultsIterator)
}
func constructQueryResponseFromIteratorMitigation(resultsIterator shim.StateQueryIteratorInterface) ([]*Mitigation, error) {
	var assets []*Mitigation
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset Mitigation
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		if strings.Contains(asset.MitigationId, "MITIGATION") {
			assets = append(assets, &asset)
		}
	}

	return assets, nil
}

// func (t *SmartContract) GetMitigationByRangeWithPagination(ctx contractapi.TransactionContextInterface, startKey string, endKey string, pageSize int, bookmark string) ([]*Mitigation, error) {

// 	resultsIterator, _, err := ctx.GetStub().GetStateByRangeWithPagination(startKey, endKey, int32(pageSize), bookmark)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer resultsIterator.Close()

// 	return constructQueryResponseFromIterator1(resultsIterator)
// }

// func getQueryResultForQueryStringWithPagination1(ctx contractapi.TransactionContextInterface, queryString string, pageSize int32, bookmark string) (*PaginatedQueryMitigationResult, error) {

// 	resultsIterator, responseMetadata, err := ctx.GetStub().GetQueryResultWithPagination(queryString, pageSize, bookmark)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer resultsIterator.Close()

// 	assets, err := constructQueryResponseFromIterator1(resultsIterator)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &PaginatedQueryMitigationResult{
// 		Records:             assets,
// 		FetchedRecordsCount: responseMetadata.FetchedRecordsCount,
// 		Bookmark:            responseMetadata.Bookmark,
// 	}, nil
// }

func (t *SmartContract) GetMitigationHistory(ctx contractapi.TransactionContextInterface, mitId string) ([]HistoryQueryMitigationResult, error) {
	// log.Printf("GetRiskHistory: ID %v", mitId)
	info := GetUserInfo(ctx)
	mitasBytes, _ := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), mitId)
	// log.Printf("GetRiskHistory: ID %v", riskId)
	mit := new(Mitigation)
	_ = json.Unmarshal(mitasBytes, mit)
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(mit.Organization.Orgname + mit.MitigationId + mit.Name)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []HistoryQueryMitigationResult
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var mitigation Mitigation
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &mitigation)
			if err != nil {
				return nil, err
			}
		} else {
			mitigation = Mitigation{}
		}

		timestamp, err := ptypes.Timestamp(response.Timestamp)
		if err != nil {
			return nil, err
		}

		record := HistoryQueryMitigationResult{
			TxId:      response.TxId,
			Timestamp: timestamp,
			Record:    &mitigation,
			IsDelete:  response.IsDelete,
		}
		records = append(records, record)
	}

	return records, nil
}

// --------------------------------------------------------------------------------Query Security Control-------------------------------------------------

func (t *SmartContract) GetSecurityControlHistory(ctx contractapi.TransactionContextInterface, scId string) ([]HistoryQuerySecurityControlResult, error) {
	// log.Printf("GetRiskHistory: ID %v", mitId)
	info := GetUserInfo(ctx)
	scasBytes, err := ctx.GetStub().GetPrivateData(strings.ReplaceAll(info[2], ".", "-"), scId)
	// log.Printf("GetRiskHistory: ID %v", riskId)
	sci := new(SecurityControl)
	_ = json.Unmarshal(scasBytes, sci)
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(sci.Organization.Orgname + sci.SecuritycontrolId + sci.Name)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []HistoryQuerySecurityControlResult
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var securitycontrol SecurityControl
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &securitycontrol)
			if err != nil {
				return nil, err
			}
		} else {
			securitycontrol = SecurityControl{}
		}

		timestamp, err := ptypes.Timestamp(response.Timestamp)
		if err != nil {
			return nil, err
		}

		record := HistoryQuerySecurityControlResult{
			TxId:      response.TxId,
			Timestamp: timestamp,
			Record:    &securitycontrol,
			IsDelete:  response.IsDelete,
		}
		records = append(records, record)
	}

	return records, nil
}

func (s *SmartContract) GetSecurityControlsByRange(ctx contractapi.TransactionContextInterface, startKey string, endKey string) ([]*SecurityControl, error) {
	info := GetUserInfo(ctx)
	resultsIterator, err := ctx.GetStub().GetPrivateDataByRange(strings.ReplaceAll(info[2], ".", "-"), startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []*SecurityControl{}

	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var sc *SecurityControl
		err = json.Unmarshal(response.Value, &sc)
		// if err != nil {
		// 	return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
		// }
		if strings.Contains(sc.SecuritycontrolId, "SECURITYCONTROL") {
			results = append(results, sc)
		}

	}

	return results, nil

}
func (s *SmartContract) MonitorSecurityControlsByRange(ctx contractapi.TransactionContextInterface, startKey string, endKey string, orgcol string) ([]*SecurityControl, error) {
	resultsIterator, err := ctx.GetStub().GetPrivateDataByRange(orgcol, startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []*SecurityControl{}

	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var sc *SecurityControl
		err = json.Unmarshal(response.Value, &sc)
		// if err != nil {
		// 	return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
		// }
		if strings.Contains(sc.SecuritycontrolId, "SECURITYCONTROL") {
			results = append(results, sc)
		}
	}

	return results, nil

}
func (t *SmartContract) QuerySecurityControls(ctx contractapi.TransactionContextInterface, queryString string) ([]*SecurityControl, error) {
	return getQueryResultForQueryStringSecurityControl(ctx, queryString)
}
func (t *SmartContract) QuerySecurityControlByApplier(ctx contractapi.TransactionContextInterface) ([]*SecurityControl, error) {
	info := GetUserInfo(ctx)
	queryString := `{"selector":{"apresponsible":"` + info[0] + `"},"use_index":["indexSecurityControl","indexSecurityControl"]}`
	return getQueryResultForQueryStringSecurityControl(ctx, queryString)
}
func (t *SmartContract) QuerySecurityControlBySubOrg(ctx contractapi.TransactionContextInterface) ([]*SecurityControl, error) {
	info := GetUserInfo(ctx)
	queryString := `{"selector":{"sorganization.suborgname":"` + info[1] + `"},"use_index":["indexSecurityControl","indexSecurityControl"]}`
	return getQueryResultForQueryStringSecurityControl(ctx, queryString)
}
func (t *SmartContract) QueryAppliedSecurityControls(ctx contractapi.TransactionContextInterface) ([]*SecurityControl, error) {

	queryString := `{"selector":{"sstatus":"APPLIED"}},"use_index":["indexSecurityControl","indexSecurityControl"]}`
	return getQueryResultForQueryStringSecurityControl(ctx, queryString)
}
func (t *SmartContract) QuerySecurityControlBySupId(ctx contractapi.TransactionContextInterface, supid string) ([]*SecurityControl, error) {

	queryString := `{"selector":{"supid":"` + supid + `"}},"use_index":["indexSecurityControl","indexSecurityControl"]}`
	return getQueryResultForQueryStringSecurityControl(ctx, queryString)
}
func (t *SmartContract) QuerySecurityControlByMitId(ctx contractapi.TransactionContextInterface, mdid string) ([]*SecurityControl, error) {

	queryString := `{"selector":{"mdid":"` + mdid + `"}},"use_index":["indexSecurityControl","indexSecurityControl"]}`
	return getQueryResultForQueryStringSecurityControl(ctx, queryString)
}
func (t *SmartContract) QuerySecurityControlByName(ctx contractapi.TransactionContextInterface, name string) ([]*SecurityControl, error) {

	queryString := `{"selector":{"mname":"` + name + `"}},"use_index":["indexSecurityControl","indexSecurityControl"]}`
	return getQueryResultForQueryStringSecurityControl(ctx, queryString)
}

// func (t *SmartContract) QuerySecurityControlsByUserApply(ctx contractapi.TransactionContextInterface) ([]*Mitigation, error) {
// 	info := GetUserInfo(ctx)
// 	queryString := `{"selector":{"apresponsible":"` + info[0] + `"}}`
// 	return getQueryResultForQueryStringMitigation(ctx, queryString)
// }

func getQueryResultForQueryStringSecurityControl(ctx contractapi.TransactionContextInterface, queryString string) ([]*SecurityControl, error) {
	info := GetUserInfo(ctx)
	resultsIterator, err := ctx.GetStub().GetPrivateDataQueryResult(strings.ReplaceAll(info[2], ".", "-"), queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	return constructQueryResponseFromIteratorSecurityControl(resultsIterator)
}
func constructQueryResponseFromIteratorSecurityControl(resultsIterator shim.StateQueryIteratorInterface) ([]*SecurityControl, error) {
	var assets []*SecurityControl
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset SecurityControl
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		if strings.Contains(asset.SecuritycontrolId, "SECURITYCONTROL") {
			assets = append(assets, &asset)
		}
	}

	return assets, nil
}

func (s *SmartContract) QueryRiskTest(ctx contractapi.TransactionContextInterface, riskId string) (*Risk, error) {
	// info := GetUserInfo(ctx)
	riskAsBytes, err := ctx.GetStub().GetPrivateData("org1-rm", riskId)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if riskAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", riskId)
	}

	risk := new(Risk)
	_ = json.Unmarshal(riskAsBytes, risk)

	return risk, nil
}

func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error create risktest chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting risktest chaincode: %s", err.Error())
	}
}
