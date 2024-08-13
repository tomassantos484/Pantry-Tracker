'use client'

import { useEffect, useState } from "react";
import { firestore } from "@/firebase";
import { Box, Typography, Modal, TextField, Button, Stack, IconButton, InputAdornment } from "@mui/material";
import { collection, query, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';

export default function Home() {
  //Components

  const[inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "inventory"));
    const docs = await getDocs(snapshot);
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({...doc.data(), id: doc.id})
    })
    setInventory(inventoryList);
  }

  const addItem = async (item) => {
    if (!item || item.trim() === '') {
      console.error('Item name cannot be empty');
      return;
    }

    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const {quantity} = docSnap.data();
      await setDoc(docRef, {quantity: quantity + 1});
    } else {
      await setDoc(docRef, {quantity: 1});
    }

    await updateInventory();
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const {quantity} = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await updateDoc(docRef, {quantity: quantity - 1});
      }
    }

    await updateInventory();
  }

  const updateItem = async (oldName, newName) => {
    if (oldName !== newName) {
      const oldDocRef = doc(collection(firestore, "inventory"), oldName);
      const newDocRef = doc(collection(firestore, "inventory"), newName);
      const oldDocSnap = await getDoc(oldDocRef);

      if (oldDocSnap.exists()) {
        await setDoc(newDocRef, oldDocSnap.data());
        await deleteDoc(oldDocRef);
      }

      await updateInventory();
    }
    setEditItem(null);
  }

  useEffect(() => {
    updateInventory();
  }, [])

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const filteredInventory = inventory.filter(item =>
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      gap={4}
      sx={{ 
        background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
        color: 'white'
      }}
    >
      <Typography variant="h3" fontWeight="bold" sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>PantryPulse</Typography>
      
      <Box 
        width="80%" 
        maxWidth="600px" 
        p={4} 
        borderRadius={4} 
        sx={{ 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'white',
              },
              '&:hover fieldset': {
                borderColor: 'white',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'white',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'white' }} />
              </InputAdornment>
            ),
          }}
        />
        {filteredInventory.length === 0 ? (
          <Typography variant="h6" textAlign="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            No items found. Add an item to get started!
          </Typography>
        ) : (
          filteredInventory.map((item) => (
            <Box 
              key={item.id} 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between" 
              gap={2} 
              mb={2}
              p={2}
              borderRadius={2}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.05)',
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {editItem === item.id ? (
                <TextField
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  onBlur={() => updateItem(item.id, itemName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateItem(item.id, itemName);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <Typography variant="h6">{item.id}: {item.quantity}</Typography>
              )}
              <Box>
                <IconButton
                  onClick={() => {
                    setEditItem(item.id);
                    setItemName(item.id);
                  }}
                  sx={{ color: 'white' }}
                >
                  <EditIcon />
                </IconButton>
                <Button 
                  variant="contained" 
                  onClick={() => addItem(item.id)} 
                  size="small" 
                  sx={{ 
                    mr: 1, 
                    minWidth: '40px',
                    backgroundColor: '#4CAF50',
                    '&:hover': {
                      backgroundColor: '#45a049'
                    }
                  }}
                >
                  +
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => removeItem(item.id)} 
                  size="small"
                  sx={{ 
                    minWidth: '40px',
                    backgroundColor: '#f44336',
                    '&:hover': {
                      backgroundColor: '#da190b'
                    }
                  }}
                >
                  -
                </Button>
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Button 
        variant="contained" 
        onClick={handleOpen}
        sx={{
          backgroundColor: '#2196F3',
          color: 'white',
          padding: '10px 20px',
          fontSize: '1rem',
          fontWeight: 'bold',
          borderRadius: '25px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s',
          '&:hover': {
            backgroundColor: '#1976D2',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        Add New Item
      </Button>

      <Modal 
        open={open} 
        onClose={handleClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box 
          width={400} 
          bgcolor="white" 
          p={4} 
          borderRadius={4} 
          boxShadow={24} 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          gap={3}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            border: 'none',
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="white">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'white',
                  },
                  '&:hover fieldset': {
                    borderColor: 'white',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => {
                addItem(itemName)
                setItemName('')
                handleClose()
              }}
              sx={{
                backgroundColor: 'white',
                color: '#2196F3',
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                }
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}