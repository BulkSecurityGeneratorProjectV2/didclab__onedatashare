import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import React from 'react';
import QueueTableSortLabel from "./QueueTableSortLabel";
import {Hidden} from "@material-ui/core";
import MenuItem from "@material-ui/core/MenuItem";
import Tooltip from "@material-ui/core/Tooltip";
import QueueMobileHeader from "./QueueMobileHeader";
import AdminHistoryTools from "./AdminHistoryTools";
import { useEffect, useState } from "react";
import TableBody from "@material-ui/core/TableBody";
import { axios } from "../../../APICalls/APICalls";
import MyModalComponent from "./MyModalComponent";
// import ProgressBar from 'react-bootstrap';
import * as ReactBootstrap from 'react-bootstrap';
// import Modal from 'react-modal';
import myData from './response.json';

function makeHeaderCells(adminPg, order, orderBy, handleRequestSort, sortableColumns) {
    let labels = [];
    let headers = [];
    let menuOpts = [];
    console.log("mydata from file",myData[0]["dataBytesSent"]);
    let titles = ["Job ID", "Progress", "Speed", "Source", "Destination"];
    let classes = ["idCell", "progressCell", "speedCell", "sourceCell", "destinationCell"];
    let keys = [sortableColumns.jobId, sortableColumns.status, sortableColumns.avgSpeed, sortableColumns.source, sortableColumns.destination];
    if (adminPg) {
        for (let i = 0; i < classes.length; i += 1) {
            classes[i] = classes[i] + "-admin";
        }
        titles.splice(0, 0, "User");
        classes.splice(0, 0, "userCell-admin");
        keys.splice(0,0, sortableColumns.userName);
        titles.push("Start Time");
        classes.push("timeCell-admin");
        keys.push(sortableColumns.startTime);
    }
    for (let i = 0; i < titles.length; i += 1) {
        labels.push(
            <QueueTableSortLabel
                handleRequestSort={handleRequestSort}
                order={order}
                orderBy={orderBy}
                sortKey={keys[i]}
                title={titles[i]}
            />
        );
    }
    for (let i = 0; i < titles.length; i += 1) {
        headers.push(
            <Tooltip title={"Sort by" + titles[i]} placement='bottom-end'>
                <TableCell className={classes[i] + " queueHeaderCell"}>
                    {labels[i]}
                </TableCell>
            </Tooltip>
        );
        menuOpts.push(
            <MenuItem value={keys[i]}>
                {titles[i]}
            </MenuItem>
        );
    }
    return [headers, menuOpts];
};

const rows = [];
const QueueTableHeaderView = ({
                                  adminPg,
                                  customToolbar,
                                  handleRequestSort,
                                  order,
                                  orderBy,
                                  page,
                                  queueFunc,
                                  refreshSuccess,
                                  refreshFailure,
                                  rowsPerPage,
                                  sortableColumns,
                              }) => {
            const [data, setData] = useState([]);
            // const [modalIsOpen, setModalIsOpen] = useState(false);
            const [selectedRow, setSelectedRow] = React.useState({});
            const [modalIsOpen, setIsOpen] = React.useState(false);
            // const modalData = {
            //     title: 'My Title From Parent',
            //     body: ['Apple', 'Ipple', 'Opple', 'Upple', 'Epple']
            //   };
            const [influxData, setInfluxData] = useState([
                [{"jobId": 7475,"throughput": 3.959031485985995E8},
                {"jobId": 7475,"throughput": 3.2620711321701264E8}],
                [{"jobId": 7476,"throughput": 4},
                 {"jobId": 7476,"throughput": 5}]]);

                function openFromParent() {
                setIsOpen(true);
                }
            
                function handleCloseModal(event, data) {
                console.log(event, data);
                setIsOpen(false);
                }
            
                function handleAfterOpen(event, data) {
                console.log(event, data);
                }

            useEffect(() => {
                axios
                  .get("/api/metadata/all/page/jobs",{
                    params :
                {	
                    page:1,
                    direction:"desc",
                    size:rowsPerPage,
                    sort:"id"
                }})
                  .then((res) => {
                    for(let j=0;j<res.data.content[j].length;j++)
                    {
                        if (res.data.content[j].status==="STARTED" || res.data.content[j].status==="STARTING")
                        {
                            axios.get("/api/metadata/measurements/job",{
                                params :
                                {
                                    jobId:res.data.content[j].id
                                }
                            })
                                .then((influx_response) => {
                                    setInfluxData((influxData) => [...influxData, influx_response.data]);                                    
                                })
                                .catch((error) => {
                                    console.log(error);
                                });
                        }  
                    }
                    console.log("res data content",res.data.content);
                    setData(res.data.content);

                  })
                  .catch((error) => {
                    console.log(error);
                  });
              }, [rowsPerPage]);
            var difference;
            var data_transfer;
            var dict = {};
            for (let i=0;i<influxData.length;i++)
            {
                dict[influxData[i][0].jobId] = influxData[i];
            }
            console.log("dictionary of influx data",dict);
            for(let i=0;i<data.length;i++)
            {
                if (data[i].status=="COMPLETED")
                {
                    difference = Date.parse(data[i].endTime)/1000 - Date.parse(data[i].startTime)/1000;
                    data[i]["total_time"] = difference;
                    data[i]["speed"]=parseFloat((data[i].jobParameters.jobSize/1000000)*8)/(difference);
                    data[i]["progress"] = 100;
                }
                else if (data[i].status=="STARTING" || data[i].status=="STARTED")
                {
                    const job_Id = data[i].id;
                    const indx =dict[job_Id].length-1;
                    data[i]["speed"] = dict[job_Id][indx].throughput;
     
                    data_transfer = 0;
                    for (var j = 0;j<data[i].length;j++)
                    {
                        data_transfer=data_transfer + data[i][j]["dataBytesSent"];
                    }
                    data[i]["progress"] = (data_transfer/data[i].jobParameters.jobSize)*100
                }
                else{
                    data[i]["speed"]=0;
                    data[i]["progress"] = 0;
                }
            }

            // const rowEvents = {
            //     onClick: (row) => {
            //     console.log(row);
            //     },
            // };
    console.log("selected row",selectedRow);
    let [headerCells, menuOpts] = makeHeaderCells(adminPg, order, orderBy, handleRequestSort, sortableColumns);
    return (
        <>
        {/* <Modal isOpen={modalIsOpen} onRequestClose={()=> setModalIsOpen(false)}>
            <button onClick={setModalIsOpenToFalse}>x</button> */}
            {/* <AnimeList/> */}
        {/* </Modal> */}
        {/* <button onClick={openFromParent}>Open Modal</button> */}
        <MyModalComponent
        dynData={selectedRow}
        IsModalOpened={modalIsOpen}
        onCloseModal={handleCloseModal}
        onAfterOpen={handleAfterOpen}
        />

        <TableHead >
            { adminPg && <AdminHistoryTools
                customToolbar={customToolbar}
                order={order}
                orderBy={orderBy}
                page={page}
                refreshFailure={refreshFailure}
                refreshSuccess={refreshSuccess}
                rowsPerPage={rowsPerPage}
                queueFunc={queueFunc}
            />
            }
            <TableRow>
                <Hidden mdDown>
                    {headerCells}
                    {/* <TableCell className="actionCell queueHeaderCell"><p>Actions</p></TableCell> */}
                </Hidden>
                <Hidden lgUp>
                    <QueueMobileHeader
                        handleRequestSort={handleRequestSort}
                        menuOpts={menuOpts}
                        orderBy={orderBy}/>
                </Hidden>
            </TableRow>
        </TableHead>
        <TableBody>
        {data.map((row) => (
            <TableRow key = {row.id} onClick={function(event) { setSelectedRow(row); openFromParent();}}>
            {/* <TableRow key={row.id}   onClick={() => { setSelectedRow(row)}}> */}
           {/* <TableRow key={row.id}   onClick={() => { setSelectedRow(row)}}> */}
             <TableCell component="th" scope="row" align="center">{row.id}</TableCell>
             <TableCell align="center">
             {/* {row.status} */}
             <ReactBootstrap.ProgressBar variant="info" now={row.progress} label={`${row.progress}%`}/>
             </TableCell>
             <TableCell align="center">{row.speed}</TableCell>
             <TableCell align="center">{row.jobParameters.sourceBasePath}</TableCell>
             <TableCell align="center">{row.jobParameters.destBasePath}</TableCell>
             {/* <TableCell align="center">3</TableCell> */}
           </TableRow>
         ))}
        </TableBody>
        </>
    );
};

export default QueueTableHeaderView;