import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../../src/services/api';
import axios from 'axios';

describe('API Service', () => {
  let originalAdapter: any;

  beforeEach(() => {
    originalAdapter = api.defaults.adapter;
    vi.spyOn(Storage.prototype, 'getItem');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    api.defaults.adapter = originalAdapter;
  });

  it('adds token to headers if it exists in localStorage', async () => {
    localStorage.setItem('token', 'test-token');

    let requestConfig: any;

    // Mock the adapter to intercept the request and return a dummy response
    api.defaults.adapter = async (config) => {
      requestConfig = config;
      return {
        data: 'success',
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      };
    };

    await api.get('/test');

    expect(Storage.prototype.getItem).toHaveBeenCalledWith('token');
    expect(requestConfig.headers.Authorization).toBe('Bearer test-token');
  });

  it('does not add token if it does not exist', async () => {
    let requestConfig: any;

    api.defaults.adapter = async (config) => {
      requestConfig = config;
      return {
        data: 'success',
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      };
    };

    await api.get('/test');

    expect(Storage.prototype.getItem).toHaveBeenCalledWith('token');
    expect(requestConfig.headers.Authorization).toBeUndefined();
  });

  it('handles 401 unauthorized errors', async () => {
    api.defaults.adapter = async (config) => {
      const error: any = new Error('Request failed with status code 401');
      error.response = { status: 401 };
      throw error;
    };

    await expect(api.get('/test')).rejects.toThrow('Request failed with status code 401');
    expect(console.error).toHaveBeenCalledWith('Unauthorized request');
  });

  it('passes through successful responses', async () => {
    api.defaults.adapter = async (config) => {
      return {
        data: 'success data',
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      };
    };

    const response = await api.get('/test');
    expect(response.data).toBe('success data');
  });
});
